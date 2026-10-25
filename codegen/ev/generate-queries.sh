#!/bin/bash

# Configuration
OPENAPI_FILE="openapi.json"
OUTPUT_DIR="./src/Query"
BACKEND_URL_VAR="\${import.meta.env.VITE_API_BACKEND_URL}" # Escaped for direct insertion into JS string
BACKEND_PORT_VAR="\${import.meta.env.VITE_API_BACKEND_PORT}" # Escaped for direct insertion into JS string

# Function to sanitize type names (replace hyphens with underscores)
sanitize_type_name() {
    echo "$1" | sed 's/-/_/g'
}

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR" || { echo "Error: Failed to create directory $OUTPUT_DIR. Exiting."; exit 1; }
echo "Ensured output directory '$OUTPUT_DIR' exists."

# --- Pre-requisites Check ---
echo "--- Checking Pre-requisites ---"
if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is not installed or not found in your PATH. Please install jq."
    echo "  macOS: brew install jq"
    echo "  Debian/Ubuntu: sudo apt install jq"
    echo "  CentOS/RHEL: sudo yum install jq / sudo dnf install jq"
    exit 1
fi
echo "jq found."

# Read and process the openapi.json file
# Iterate over each path in the OpenAPI spec
jq -c '.paths | to_entries[]' "$OPENAPI_FILE" | while read -r path_entry; do
    original_path_key=$(echo "$path_entry" | jq -r '.key') # e.g., /enums/{enum_name}
    
    # --- MODIFICATION 1: Skip paths that do not start with /api ---
    if [[ ! "$original_path_key" =~ ^/api(/|$) ]]; then
        continue
    fi

    methods=$(echo "$path_entry" | jq -c '.value | to_entries[]')

    # Iterate over each HTTP method (get, post, put, delete, patch) for the current path
    echo "$methods" | while read -r method_entry; do
        http_method_raw=$(echo "$method_entry" | jq -r '.key') # e.g., 'get'
        http_method=$(echo "$http_method_raw" | tr '[:lower:]' '[:upper:]') # e.g., 'GET'

        operation_data=$(echo "$method_entry" | jq -r '.value')
        operation_id=$(echo "$operation_data" | jq -r '.operationId // ""')

        if [ -z "$operation_id" ] || [ "$operation_id" == "null" ]; then
            echo "Warning: Skipping path '$original_path_key', method '$http_method'. No 'operationId' found."
            continue
        fi

        # --- Naming Logic Refinement ---
        # --- MODIFICATION 2: Strip the ^/api prefix before cleaning segments ---
        clean_path_segments=$(echo "$original_path_key" | sed -E 's/^\/api//' | sed -E 's/^\/|\/$//g' | sed -E 's/\{[^}]+\}//g' | sed -E 's/\/+/\//g' | sed -E 's/^-//')

        hook_base_name=""
        clean_path_segments_array=()
        if [ -n "$clean_path_segments" ]; then
            IFS='/' read -r -a clean_path_segments_array <<< "$clean_path_segments"
            for segment in "${clean_path_segments_array[@]}"; do
                hook_base_name+=$(echo "$segment" | sed -E 's/(^[a-z])/\U\1/' | sed -E 's/([_-][a-z])/\U\1/g' | sed -E 's/[_-]//g')
            done
        else
            first_tag=$(echo "$operation_data" | jq -r '.tags[0] // ""')
            if [ -n "$first_tag" ] && [ "$first_tag" != "null" ]; then
                hook_base_name=$(echo "$first_tag" | sed -E 's/(^[a-z])/\U\1/')
            else
                hook_base_name="Root"
            fi
        fi

        method_verb_prefix=""
        case "$http_method" in
            "GET") 
                if echo "$operation_id" | grep -q "^list"; then
                    method_verb_prefix="List"
                else
                    method_verb_prefix="Get"
                fi
                ;;
            "POST") method_verb_prefix="Post" ;;
            "PUT") method_verb_prefix="Put" ;;
            "DELETE") method_verb_prefix="Delete" ;;
            "PATCH") method_verb_prefix="Patch" ;;
        esac

        lower_hook_base=$(echo "$hook_base_name" | tr '[:upper:]' '[:lower:]')
        lower_method_verb=$(echo "$method_verb_prefix" | tr '[:upper:]' '[:lower:]')

        if [[ ! "$lower_hook_base" =~ ^"$lower_method_verb" ]]; then
            hook_base_name="${method_verb_prefix}${hook_base_name}"
        fi

        hook_base_name=$(echo "$hook_base_name" | sed -E 's/(^[a-z])/\U\1/')


        fetch_function_name="fetch$hook_base_name"
        hook_name="use$hook_base_name"
        file_name="${hook_name}.ts"
        output_file="${OUTPUT_DIR}/${file_name}"

        # --- Initialize parameter storage ---
        path_param_signatures=()
        path_param_names_only=()
        query_params_ts_members=""
        query_param_names_only=()

        request_body_raw_type=""
        request_body_type="unknown" # Default to unknown for request body type
        has_request_body=false
        request_body_content_type="application/json"
        form_data_code="" # FormData construction, only for multipart/form-data bodies

        current_path_for_url="$original_path_key"

        # --- Variables to track custom types for import ---
        custom_schema_types_for_import=() # To store unique type names for import from Query/Types

        # --- Parse Parameters (Path and Query) ---
        
        # Use process substitution to avoid subshell issues
        while read -r param; do
            param_name=$(echo "$param" | jq -r '.name')
            param_in=$(echo "$param" | jq -r '.in')
            param_type_schema=$(echo "$param" | jq -r '.schema."$ref" // .schema.type // "unknown"')

            ts_type="unknown"
            if [[ "$param_type_schema" == "#/components/schemas/"* ]]; then
                ts_type=$(basename "$param_type_schema")
                ts_type=$(sanitize_type_name "$ts_type")
                custom_schema_types_for_import+=("$ts_type")
            else
                case "$param_type_schema" in
                    "string") ts_type="string" ;;
                    "integer"|"number") ts_type="number" ;;
                    "boolean") ts_type="boolean" ;;
                    "array") ts_type="unknown[]" ;;
                    *) ts_type="unknown" ;;
                esac
            fi


            if [ "$param_in" == "path" ]; then
                path_param_signatures+=("$param_name: $ts_type")
                path_param_names_only+=("$param_name")
                current_path_for_url=$(echo "$current_path_for_url" | sed "s/{$param_name}/\${${param_name}}/g")
            elif [ "$param_in" == "query" ]; then
                param_required=$(echo "$param" | jq -r '.required // false')
                if [ "$param_required" == "true" ]; then
                    query_params_ts_members+="$param_name: $ts_type; "
                else
                    query_params_ts_members+="$param_name?: $ts_type; "
                fi
                query_param_names_only+=("$param_name")
            fi
        done < <(echo "$operation_data" | jq -c '(.parameters // [])[] // {}')

        # --- Parse Request Body ---
        request_body_json=$(echo "$operation_data" | jq -c '.requestBody // {}')
        if [ "$(echo "$request_body_json" | jq 'has("content")')" == "true" ]; then
            has_request_body=true
            request_body_content_type=$(echo "$request_body_json" | jq -r '(.content // {}) | keys[0] // "application/json"')
            if [[ "$request_body_content_type" == *"multipart/form-data"* ]]; then
                # File uploads cannot use the generated Body_* schema type: OpenAPI describes
                # binary fields as 'string', which cannot represent a File. Build an explicit
                # object type instead (binary fields -> File) and assemble the FormData here,
                # so callers pass plain values and never touch FormData themselves.
                multipart_schema_ref=$(echo "$request_body_json" | jq -r --arg ct "$request_body_content_type" '.content[$ct].schema."$ref" // ""')
                multipart_members=()

                if [ -n "$multipart_schema_ref" ]; then
                    multipart_schema_name=$(basename "$multipart_schema_ref")
                    multipart_schema=$(jq -c --arg n "$multipart_schema_name" '.components.schemas[$n] // {}' "$OPENAPI_FILE")

                    while read -r prop_entry; do
                        [ -z "$prop_entry" ] && continue
                        prop_name=$(echo "$prop_entry" | jq -r '.key')
                        prop_type=$(echo "$prop_entry" | jq -r '.value.type // ""')
                        prop_is_binary=$(echo "$prop_entry" | jq -r 'if (.value.contentMediaType != null) or (.value.format == "binary") then "true" else "false" end')
                        prop_required=$(echo "$multipart_schema" | jq -r --arg n "$prop_name" 'if ((.required // []) | index($n)) then "true" else "false" end')

                        if [ "$prop_is_binary" == "true" ]; then
                            prop_ts_type="File"
                        else
                            case "$prop_type" in
                                "string")           prop_ts_type="string" ;;
                                "integer"|"number") prop_ts_type="number" ;;
                                "boolean")          prop_ts_type="boolean" ;;
                                *)                  prop_ts_type="unknown" ;;
                            esac
                        fi

                        if [ "$prop_required" == "true" ]; then
                            multipart_members+=("$prop_name: $prop_ts_type")
                        else
                            multipart_members+=("$prop_name?: $prop_ts_type")
                        fi

                        # File values are appended as-is; everything else is stringified for transport.
                        if [ "$prop_is_binary" == "true" ]; then
                            append_value="data.$prop_name"
                        else
                            append_value="String(data.$prop_name)"
                        fi

                        if [ "$prop_required" == "true" ]; then
                            form_data_code+="    formData.append(\"$prop_name\", $append_value);"$'\n'
                        else
                            form_data_code+="    if (data.$prop_name !== undefined && data.$prop_name !== null) formData.append(\"$prop_name\", $append_value);"$'\n'
                        fi
                    done < <(echo "$multipart_schema" | jq -c '(.properties // {}) | to_entries[]')
                fi

                if [ ${#multipart_members[@]} -gt 0 ]; then
                    request_body_type="{ $(printf "%s; " "${multipart_members[@]}" | sed 's/; $//') }"
                    form_data_code="    const formData = new FormData();"$'\n'"$form_data_code"
                else
                    # Schema-less multipart body: fall back to letting the caller supply the FormData.
                    request_body_type="FormData"
                    form_data_code=""
                fi
            else
                schema_ref=$(echo "$request_body_json" | jq -r --arg ct "$request_body_content_type" '.content[$ct].schema."$ref" // ""')
                if [ -n "$schema_ref" ]; then
                    request_body_raw_type=$(basename "$schema_ref")
                    request_body_raw_type=$(sanitize_type_name "$request_body_raw_type")
                    request_body_type="$request_body_raw_type"
                    custom_schema_types_for_import+=("$request_body_raw_type")
                else
                    request_body_type="unknown"
                fi
            fi
        fi

        # --- Determine Return Type ---
        return_type="unknown" # Initial default for return type
        return_type_raw_type=""
        is_blob_response=false # True when the success response is a non-JSON media type (image/octet-stream/etc.)

        response_content=""
        successful_response_codes=("200" "201" "202" "203" "204" "205" "206")
        for code in "${successful_response_codes[@]}"; do
            if [ "$(echo "$operation_data" | jq --arg code_var "$code" '.responses[$code_var].content != null')" == "true" ]; then
                response_content=$(echo "$operation_data" | jq -c --arg code_var "$code" '.responses[$code_var].content // {}')
                break
            fi
        done

        if [ -n "$response_content" ] && [ "$(echo "$response_content" | jq 'has("application/json")')" == "true" ]; then
            response_schema=$(echo "$response_content" | jq -r '.["application/json"].schema // {}')
            response_schema_type=$(echo "$response_schema" | jq -r '.type // ""')
            response_schema_items_ref=$(echo "$response_schema" | jq -r '.items."$ref" // ""')
            response_schema_items_type=$(echo "$response_schema" | jq -r '.items.type // ""')
            response_schema_ref=$(echo "$response_schema" | jq -r '."$ref" // ""')

            if [ -n "$response_schema_ref" ]; then
                return_type=$(basename "$response_schema_ref")
                return_type=$(sanitize_type_name "$return_type")
                return_type_raw_type="$return_type"
                custom_schema_types_for_import+=("$return_type_raw_type")
            elif [ "$response_schema_type" == "array" ]; then
                if [ -n "$response_schema_items_ref" ]; then
                    item_type=$(basename "$response_schema_items_ref")
                    item_type=$(sanitize_type_name "$item_type")
                    return_type="$item_type[]"
                    return_type_raw_type="$item_type"
                    custom_schema_types_for_import+=("$item_type")
                elif [ -n "$response_schema_items_type" ]; then
                    case "$response_schema_items_type" in
                        "string") return_type="string[]" ;;
                        "integer"|"number") return_type="number[]" ;;
                        "boolean") return_type="boolean[]" ;;
                        *) return_type="unknown[]" ;;
                    esac
                else
                    return_type="unknown[]"
                fi
            elif [ -n "$response_schema_type" ]; then
                case "$response_schema_type" in
                    "string") return_type="string" ;;
                    "integer"|"number") return_type="number" ;;
                    "boolean") return_type="boolean" ;;
                    "object") return_type="Record<string, unknown>" ;;
                    *) return_type="unknown" ;;
                esac
            fi
        elif [ -n "$response_content" ]; then
            # Success response is declared with a non-JSON media type (e.g. image/jpeg,
            # application/octet-stream) — treat it as a raw binary payload.
            return_type="Blob"
            is_blob_response=true
        fi


        # --- Construct Fetch Function Signature and Arguments ---
        fetch_func_signature_parts=()
        fetch_func_call_args_for_query_or_mutation_fn=()

        if [ ${#path_param_signatures[@]} -gt 0 ]; then
            for param_sig in "${path_param_signatures[@]}"; do
                fetch_func_signature_parts+=("$param_sig")
            done
            for param_name in "${path_param_names_only[@]}"; do
                fetch_func_call_args_for_query_or_mutation_fn+=("$param_name")
            done
        fi

        if [ -n "$query_params_ts_members" ]; then
            has_required_query_params=$(echo "$operation_data" | jq -e '(.parameters // [])[] | select(.in == "query" and .required == true)' > /dev/null; echo $?)
            if [ "$has_required_query_params" -eq 0 ]; then
                fetch_func_signature_parts+=("queryArgs: { $query_params_ts_members }")
            else
                fetch_func_signature_parts+=("queryArgs?: { $query_params_ts_members }")
            fi
            fetch_func_call_args_for_query_or_mutation_fn+=("queryArgs")
        fi

        if [ "$has_request_body" == "true" ]; then
            fetch_func_signature_parts+=("data: $request_body_type")
        fi
        fetch_func_signature=$(printf "%s, " "${fetch_func_signature_parts[@]}" | sed 's/, $//')


        # --- Build URL Construction Logic for the Fetch Function ---
        url_template_literal="\`${BACKEND_URL_VAR}:${BACKEND_PORT_VAR}$current_path_for_url\`"
        url_builder_code=""

        if [ ${#query_param_names_only[@]} -gt 0 ]; then
            url_builder_code+="    let url = $url_template_literal;"$'\n'
            url_builder_code+="    const params = new URLSearchParams();"$'\n'
            for q_param_name in "${query_param_names_only[@]}"; do
                # An array-valued query parameter must be emitted as repeated params
                # (?k=a&k=b). String([a,b]) would join them with a comma into a single value,
                # which FastAPI rejects with a 422 for a List[Enum] parameter.
                url_builder_code+="    if (queryArgs?.$q_param_name !== undefined && queryArgs?.$q_param_name !== null) {"$'\n'
                url_builder_code+="        if (Array.isArray(queryArgs.$q_param_name)) { for (const v of queryArgs.$q_param_name) params.append(\"$q_param_name\", String(v)); }"$'\n'
                url_builder_code+="        else { params.append(\"$q_param_name\", String(queryArgs.$q_param_name)); }"$'\n'
                url_builder_code+="    }"$'\n'
            done
            url_builder_code+="    if (params.toString()) { url += \"?\" + params.toString(); }"
        else
            url_builder_code="    const url = $url_template_literal;"
        fi

        # --- Determine React Query import statements ---
        react_query_import_statement="import { "
        if [ "$http_method" == "GET" ]; then
            react_query_import_statement+="useQuery"
            react_query_type_import_statement="import type { UseQueryOptions } from \"@tanstack/react-query\";"
        else
            react_query_import_statement+="useMutation"
            react_query_type_import_statement="import type { UseMutationOptions } from \"@tanstack/react-query\";"
        fi
        react_query_import_statement+=" } from \"@tanstack/react-query\";"

        # --- Build the fetch() request-init lines ---
        # Assembled up-front rather than inline in the heredoc so that omitted pieces
        # leave no blank or half-indented lines behind in the generated file.
        cache_code=""
        if [ "$http_method" == "GET" ]; then
            # Always revalidate: TanStack Query owns caching, the HTTP cache only gets in the way.
            cache_code="        cache: \"no-store\","$'\n'
        fi
        headers_code="            \"X-Client-ID\": sessionStorage.getItem(\"x-client-id\") || \"\","$'\n'
        body_code=""
        if [ "$has_request_body" == "true" ]; then
            if [[ "$request_body_content_type" == *"multipart/form-data"* ]]; then
                # No Content-Type header: the browser must set it to include the multipart boundary.
                if [ -n "$form_data_code" ]; then
                    body_code="        body: formData,"$'\n'
                else
                    body_code="        body: data,"$'\n'
                fi
            else
                headers_code+="            \"Content-Type\": \"$request_body_content_type\","$'\n'
                body_code="        body: JSON.stringify(data),"$'\n'
            fi
        fi

        # --- Build the response-parsing lines ---
        response_parse_code=""
        if [ "$is_blob_response" == "true" ]; then
            response_parse_code+="    return response.blob();"$'\n'
        elif [ "$http_method" == "DELETE" ] && [ -z "$response_content" ]; then
            response_parse_code+="    // DELETE operations typically return 204 No Content, so we don't try to parse JSON"$'\n'
            if [ "$return_type" == "unknown" ]; then
                response_parse_code+="    return Promise.resolve({} as ${return_type});"$'\n'
            else
                response_parse_code+="    return Promise.resolve(undefined as ${return_type});"$'\n'
            fi
        else
            response_parse_code+="    const contentType = response.headers.get(\"content-type\");"$'\n'
            response_parse_code+="    if (contentType && contentType.includes(\"application/json\")) {"$'\n'
            response_parse_code+="        return response.json() as Promise<${return_type}>;"$'\n'
            response_parse_code+="    }"$'\n'
            case "$return_type" in
                "void")    response_parse_code+="    return Promise.resolve(undefined as ${return_type});"$'\n' ;;
                "string")  response_parse_code+="    return Promise.resolve(\"\") as Promise<${return_type}>;"$'\n' ;;
                "number")  response_parse_code+="    return Promise.resolve(0) as Promise<${return_type}>;"$'\n' ;;
                "boolean") response_parse_code+="    return Promise.resolve(false) as Promise<${return_type}>;"$'\n' ;;
                *[]*)      response_parse_code+="    return Promise.resolve([]) as Promise<${return_type}>;"$'\n' ;;
                *)         response_parse_code+="    return Promise.resolve({} as ${return_type});"$'\n' ;;
            esac
        fi

        # --- Generate File Content ---
        echo "Generating $output_file for operation '$operation_id' ($http_method)."
        cat <<EOF > "$output_file"
${react_query_import_statement}
${react_query_type_import_statement}
$(
            # Process custom_schema_types_for_import for unique types and generate import statement
            unique_types_file=$(mktemp)
            for type_name in "${custom_schema_types_for_import[@]}"; do
                echo "$type_name" >> "$unique_types_file"
            done
            
            # Get unique types and create import statement
            unique_types=$(sort -u "$unique_types_file" | grep -v '^$' | tr '\n' ',' | sed 's/,$//')
            rm "$unique_types_file"
            
            if [ -n "$unique_types" ]; then
                # Convert comma-separated list to properly formatted import
                IFS=',' read -ra type_array <<< "$unique_types"
                valid_types=()
                for type_name in "${type_array[@]}"; do
                    # Filter out primitive types and invalid type names
                    if [ -n "$type_name" ] && \
                       [ "$type_name" != "string" ] && [ "$type_name" != "number" ] && \
                       [ "$type_name" != "boolean" ] && \
                       ! [[ "$type_name" == *"[]"* ]] && \
                       [ "$type_name" != "unknown" ] && \
                       [ "$type_name" != "void" ] && \
                       [ "$type_name" != "Record<string, unknown>" ]
                    then
                        valid_types+=("$type_name")
                    fi
                done
                
                if [ ${#valid_types[@]} -gt 0 ]; then
                    import_types=$(printf ", %s" "${valid_types[@]}" | cut -c 3-)
                    echo "import type { ${import_types} } from \"./Types\";"
                fi
            fi
        )

const ${fetch_function_name} = async (${fetch_func_signature}): Promise<${return_type}> => {
${url_builder_code}
${form_data_code}    const response = await fetch(url, {
        method: "$http_method",
        credentials: "include",
${cache_code}        headers: {
${headers_code}        },
${body_code}    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown network error" }));
        throw new Error(errorData.detail || \`Network response was not ok: \${response.status}\`);
    }
${response_parse_code}};

EOF
        # Determine if it's a GET request to use useQuery or a mutation hook
        if [ "$http_method" == "GET" ]; then
            # The key array itself is assembled by the builder below, which walks the
            # parameters at runtime rather than being spliced together here - that is what
            # lets a caller omit trailing parameters and get a prefix back.
            has_query_args=false
            if [ -n "$query_params_ts_members" ]; then
                has_query_args=true
            fi

            query_fn_call_args=$(printf "%s, " "${fetch_func_call_args_for_query_or_mutation_fn[@]}" | sed 's/, $//')

            # --- Query key builder: exported so callers can build partial/prefix
            # keys for cache invalidation without duplicating the key shape.
            #
            # EVERY parameter is optional here, including path params, and the key is
            # truncated at the first one omitted. That is what makes domain-wide
            # invalidation possible: getSpendMonthQueryKey() returns just
            # ["<operationId>"], which TanStack's default non-exact matching uses as a
            # prefix and so invalidates every year/month cached so far. Requiring path
            # params would force a caller to know every combination it had ever fetched.
            # The hook itself still passes all of them, producing the full key.
            key_builder_name="$(printf '%s' "${hook_base_name:0:1}" | tr '[:upper:]' '[:lower:]')${hook_base_name:1}QueryKey"

            key_builder_sig_parts=()
            key_builder_names=()
            for param_sig in "${path_param_signatures[@]}"; do
                # "name: type" -> "name?: type", so the builder can be called bare.
                key_builder_sig_parts+=("$(echo "$param_sig" | sed 's/^\([A-Za-z_][A-Za-z0-9_]*\):/\1?:/')")
                key_builder_names+=("$(echo "$param_sig" | sed 's/:.*//' | tr -d ' ')")
            done
            if [ "$has_query_args" == "true" ]; then
                key_builder_sig_parts+=("queryArgs?: { $query_params_ts_members }")
                key_builder_names+=("queryArgs")
            fi
            key_builder_sig=$(printf "%s, " "${key_builder_sig_parts[@]}" | sed 's/, $//')

            if [ ${#key_builder_names[@]} -eq 0 ]; then
                cat <<EOF_KEY_BUILDER >> "$output_file"
export const ${key_builder_name} = () => {
    return ["${operation_id}"] as const;
};

EOF_KEY_BUILDER
            else
                key_builder_parts_list=$(printf "%s, " "${key_builder_names[@]}" | sed 's/, $//')
                cat <<EOF_KEY_BUILDER >> "$output_file"
export const ${key_builder_name} = (${key_builder_sig}) => {
    const key: unknown[] = ["${operation_id}"];
    for (const part of [${key_builder_parts_list}]) {
        if (part === undefined) return key;
        key.push(part);
    }
    return key;
};

EOF_KEY_BUILDER
            fi

            fixed_params="options?: Partial<UseQueryOptions<${return_type}, Error>>"
            hook_params=$(printf "%s, " "${fetch_func_signature_parts[@]}" | sed 's/, $//' | sed 's/\(data: .*\)//')
            if [ -z "$hook_params" ]; then
                hook_params_output="(${fixed_params})"
            else
                hook_params_output="(${hook_params}, ${fixed_params})"
            fi

            cat <<EOF_GET_HOOK >> "$output_file"
export const ${hook_name} = ${hook_params_output} => {
    return useQuery<${return_type}, Error>({
        queryKey: ${key_builder_name}(${query_fn_call_args}),
        queryFn: () => ${fetch_function_name}(${query_fn_call_args}),
        retry: false,
        ...options,
    });
};
EOF_GET_HOOK
        else # For POST, PUT, PATCH, DELETE methods, use useMutation
            # Build mutation variables type that includes all dynamic parameters
            mutation_variable_parts=()
            
            # Include path parameters in mutation variables
            if [ ${#path_param_signatures[@]} -gt 0 ]; then
                for param_sig in "${path_param_signatures[@]}"; do
                    mutation_variable_parts+=("$param_sig")
                done
            fi
            
            # Include query parameters in mutation variables if present
            if [ -n "$query_params_ts_members" ]; then
                has_required_query_params=$(echo "$operation_data" | jq -e '(.parameters // [])[] | select(.in == "query" and .required == true)' > /dev/null; echo $?)
                if [ "$has_required_query_params" -eq 0 ]; then
                    mutation_variable_parts+=("queryArgs: { $query_params_ts_members }")
                else
                    mutation_variable_parts+=("queryArgs?: { $query_params_ts_members }")
                fi
            fi
            
            # Include request body in mutation variables if present
            if [ "$has_request_body" == "true" ]; then
                mutation_variable_parts+=("data: $request_body_type")
            fi
            
            # Build the mutation variables type
            if [ ${#mutation_variable_parts[@]} -eq 0 ]; then
                mutation_variables_type="void"
                mutation_fn_signature="() => ${fetch_function_name}()"
            else
                mutation_variables_type="{ $(printf "%s; " "${mutation_variable_parts[@]}" | sed 's/; $//') }"
                
                # Build the destructured parameters for mutation function
                destructured_params=()
                if [ ${#path_param_names_only[@]} -gt 0 ]; then
                    for param_name in "${path_param_names_only[@]}"; do
                        destructured_params+=("$param_name")
                    done
                fi
                if [ -n "$query_params_ts_members" ]; then
                    destructured_params+=("queryArgs")
                fi
                if [ "$has_request_body" == "true" ]; then
                    destructured_params+=("data")
                fi
                
                destructured_list=$(printf "%s, " "${destructured_params[@]}" | sed 's/, $//')
                fetch_call_args=$(printf "%s, " "${destructured_params[@]}" | sed 's/, $//')
                
                mutation_fn_signature="({ ${destructured_list} }) => ${fetch_function_name}(${fetch_call_args})"
            fi

            cat <<EOF_MUTATION_HOOK >> "$output_file"
export const ${hook_name} = (options?: Partial<UseMutationOptions<${return_type}, Error, ${mutation_variables_type}>>) => {
    return useMutation<${return_type}, Error, ${mutation_variables_type}>({
        mutationFn: ${mutation_fn_signature},
        retry: false,
        ...options,
    });
};
EOF_MUTATION_HOOK
        fi
    done
done

echo "Script finished. Hooks generated in '$OUTPUT_DIR'."