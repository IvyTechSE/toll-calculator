namespace TollFeeCalculator;

public static class TollFreeDate
{
    // This should use a library like https://www.nuget.org/packages/PublicHoliday/ or an API instead of being 
    // hardcoded but I decided that is out of scope of the exercise.
    private static readonly List<DateOnly> Holidays =
    [
        new(2025, 1, 1),
        new(2025, 1, 6),
        new(2025, 4, 18),
        new(2025, 4, 20),
        new(2025, 4, 21),
        new(2025, 5, 1),
        new(2025, 5, 29),
        new(2025, 6, 6),
        new(2025, 6, 8),
        new(2025, 6, 20),
        new(2025, 6, 21),
        new(2025, 11, 1),
        new(2025, 12, 24),
        new(2025, 12, 25),
        new(2025, 12, 26),
        new(2025, 12, 31),
        new(2026, 1, 1),
        new(2026, 1, 6),
        new(2026, 4, 3),
        new(2026, 4, 4),
        new(2026, 4, 5),
        new(2026, 4, 6),
        new(2026, 5, 1),
        new(2026, 5, 14),
        new(2026, 5, 24),
        new(2026, 6, 6),
        new(2026, 6, 19),
        new(2026, 6, 20),
        new(2026, 10, 31),
        new(2026, 12, 24),
        new(2026, 12, 25),
        new(2026, 12, 26),
        new(2026, 12, 31)
    ];

    // In the old logic July is toll free so it is here too. 
    public static bool IsTollFree(DateTime date)
    {
        if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) return true;
        if (date.Month == 7) return true;

        return Holidays.Any(holiday => holiday == DateOnly.FromDateTime(date));
    }
}