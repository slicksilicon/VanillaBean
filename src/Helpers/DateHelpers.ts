export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

export const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getUtcIsoString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    const utcString = `${year}-${month}-${day}T23:00:00Z`;

    return utcString;
}

export function getMonthName(date : Date | number): string {    
    if (typeof date === "number") {
        return monthNames[date-1];
    }

    return monthNames[date.getMonth()];
}


export function getDayName(date: Date): string {
    return dayNames[date.getDay()];
}

export function getDayWithOrdinal(date: Date): string {
    const day = date.getDate();
    const getOrdinalSuffix = (day: number): string => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };
    return `${day}${getOrdinalSuffix(day)}`;
}

export function getDayLabel(date: Date): string {
    // Get weekday name
    const weekday = getDayName(date);

    // Create label: "20th, Fri"
    return `${getDayWithOrdinal(date)}, ${weekday}`;
}

export function getDayMonthLabel(date: Date): string {
    // Get month name
    const month = getMonthName(date);

    // Create label: "20th, January"
    return `${getDayWithOrdinal(date)}, ${month}`;
}

export function getLastDayOfQuarter(year: number, quarter: number): string {
    const month = quarter * 3 - 1; // Quarter 1 -> month 2 (March), Quarter 2 -> month 5 (June), etc.
    const lastDay = new Date(year, month + 1, 0); // Day 0 of next month = last day of current month
    return lastDay.toISOString().split("T")[0]; // Return YYYY-MM-DD format
}

export interface QuarterYear {
    quarter: string;
    year: number;
}

export function getCurrentQuarter(): QuarterYear {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Calculate current quarter (0-indexed month / 3 = quarter index 0-3)
    const currentQuarterIndex = Math.floor(currentMonth / 3);
    
    return { quarter: `Q${currentQuarterIndex + 1}`, year: currentYear };
}

export function formatSyncDateTime(dateString: string | undefined): string {
    if (!dateString) return "N/A";
            
    // If the dateString doesn't end with 'Z' or have timezone info, append 'Z' to treat it as UTC
    let dateStringWithTz = dateString;
    if (!dateString.endsWith("Z") && !dateString.includes("+") && !dateString.includes("T00:00:00")) {
        dateStringWithTz = dateString + "Z";        
    }
    
    const date = new Date(dateStringWithTz);
    
    // Get local time components    
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Reuse existing getDayWithOrdinal function
    const dayWithOrdinal = getDayWithOrdinal(date);
    const monthName = monthNamesShort[month];
    const hoursStr = String(hours).padStart(2, "0");
    const minutesStr = String(minutes).padStart(2, "0");
    
    return `${dayWithOrdinal} ${monthName} ${year} ${hoursStr}:${minutesStr}`;
}

export function formatEmailReceivedDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays < 7) {
        // Less than 7 days: show Day of Week and time (HH:MM)
        const dayName = getDayName(date);
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${dayName} ${hours}:${minutes}`;
    } else {
        // More than 7 days: show DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

