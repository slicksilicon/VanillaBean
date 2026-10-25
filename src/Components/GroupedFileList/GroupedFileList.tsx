import { useMemo, type FC } from "react";
import QueryState from "../QueryState/QueryState";
import "./GroupedFileList.css";

export interface GroupedFileListItem {
    file_id: string;
    file_path: string;
    /** Short badge shown at the right of each row, e.g. a count or status. */
    meta?: string;
}

interface GroupedFileListProps {
    files: GroupedFileListItem[];
    selectedFileId?: string | null;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
    emptyMessage?: string;
    onSelect?: (file: GroupedFileListItem) => void;
}

interface FileGroup {
    groupPath: string;
    files: GroupedFileListItem[];
}

const ROOT_GROUP_LABEL = "Root";

const getGroupDepth = (groupPath: string): number => {
    if (groupPath === ROOT_GROUP_LABEL) {
        return 0;
    }

    return groupPath.split("/").filter((segment) => segment !== "").length;
};

const normalizePath = (filePath: string): string => {
    const normalized = filePath.replace(/\\+/g, "/").replace(/\/+/g, "/");
    if (normalized.length > 1 && normalized.endsWith("/")) {
        return normalized.slice(0, -1);
    }

    return normalized;
};

const splitPath = (filePath: string): string[] => normalizePath(filePath).split("/").filter((segment) => segment !== "");

const getDirectoryPath = (filePath: string): string => {
    const normalized = normalizePath(filePath);
    const separatorIndex = normalized.lastIndexOf("/");
    if (separatorIndex <= 0) {
        return normalized.startsWith("/") ? "/" : "";
    }

    return normalized.slice(0, separatorIndex);
};

const getFileName = (filePath: string): string => {
    const normalized = normalizePath(filePath);
    const separatorIndex = normalized.lastIndexOf("/");
    return separatorIndex === -1 ? normalized : normalized.slice(separatorIndex + 1);
};

const getCommonDirectoryPath = (files: GroupedFileListItem[]): string => {
    if (files.length === 0) {
        return "";
    }

    const directorySegments = files.map((file) => splitPath(getDirectoryPath(file.file_path)));
    const shortestSegmentCount = Math.min(...directorySegments.map((segments) => segments.length));
    const commonSegments: string[] = [];

    for (let index = 0; index < shortestSegmentCount; index += 1) {
        const currentSegment = directorySegments[0][index];
        if (directorySegments.every((segments) => segments[index] === currentSegment)) {
            commonSegments.push(currentSegment);
            continue;
        }
        break;
    }

    if (commonSegments.length === 0) {
        return "/";
    }

    return `/${commonSegments.join("/")}`;
};

const getRelativeGroupPath = (filePath: string, commonDirectory: string): string => {
    const directoryPath = getDirectoryPath(filePath);
    const normalizedCommonDirectory = commonDirectory === "/" ? "/" : normalizePath(commonDirectory);

    if (normalizedCommonDirectory === "/") {
        const relativeFromRoot = directoryPath.startsWith("/") ? directoryPath.slice(1) : directoryPath;
        return relativeFromRoot || ROOT_GROUP_LABEL;
    }

    if (directoryPath === normalizedCommonDirectory) {
        return ROOT_GROUP_LABEL;
    }

    const relativePath = directoryPath.startsWith(`${normalizedCommonDirectory}/`)
        ? directoryPath.slice(normalizedCommonDirectory.length + 1)
        : directoryPath;

    return relativePath || ROOT_GROUP_LABEL;
};

/**
 * Renders a flat file list grouped by their common path prefix, with a
 * loading/error/empty gate via QueryState. Pass `meta` on each item for a
 * per-row badge (e.g. a count or status) — the list itself is content-agnostic.
 */
const GroupedFileList: FC<GroupedFileListProps> = ({
    files,
    selectedFileId = null,
    loading = false,
    error = null,
    onRetry,
    emptyMessage = "No files available.",
    onSelect,
}) => {
    const commonDirectoryPath = useMemo(() => getCommonDirectoryPath(files), [files]);

    const groupedFiles = useMemo((): FileGroup[] => {
        const groups = new Map<string, GroupedFileListItem[]>();

        for (const file of files) {
            const groupPath = getRelativeGroupPath(file.file_path, commonDirectoryPath);
            const existing = groups.get(groupPath);
            if (existing) {
                existing.push(file);
                continue;
            }
            groups.set(groupPath, [file]);
        }

        return Array.from(groups.entries())
            .sort(([leftPath], [rightPath]) => {
                const depthDifference = getGroupDepth(leftPath) - getGroupDepth(rightPath);
                if (depthDifference !== 0) {
                    return depthDifference;
                }

                return leftPath.localeCompare(rightPath, undefined, { sensitivity: "base" });
            })
            .map(([groupPath, groupedItems]) => ({
                groupPath,
                files: [...groupedItems].sort((leftFile, rightFile) => getFileName(leftFile.file_path).localeCompare(getFileName(rightFile.file_path), undefined, { sensitivity: "base" })),
            }));
    }, [commonDirectoryPath, files]);

    return (
        <div className="grouped-file-list">
            <div className="grouped-file-list-header">
                <div className="grouped-file-list-title">{commonDirectoryPath || "No files"}</div>
                <div className="grouped-file-list-count">{files.length} files</div>
            </div>

            <div className="grouped-file-list-scroll">
                <QueryState
                    isLoading={loading}
                    isError={!!error}
                    error={error}
                    isEmpty={files.length === 0}
                    emptyMessage={emptyMessage}
                    loadingLabel="Loading files…"
                    onRetry={onRetry}
                >
                    {groupedFiles.map((group) => (
                        <div key={group.groupPath} className="grouped-file-list-group">
                            <div className="grouped-file-list-group-title">{group.groupPath}</div>
                            <div className="grouped-file-list-group-items">
                                {group.files.map((file) => (
                                    <button
                                        key={file.file_id}
                                        type="button"
                                        className={`grouped-file-list-item${selectedFileId === file.file_id ? " selected" : ""}`}
                                        title={file.file_path}
                                        onClick={() => onSelect?.(file)}
                                    >
                                        <span className="grouped-file-list-item-name">{getFileName(file.file_path)}</span>
                                        {file.meta && <span className="grouped-file-list-item-meta">{file.meta}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </QueryState>
            </div>
        </div>
    );
};

export default GroupedFileList;
