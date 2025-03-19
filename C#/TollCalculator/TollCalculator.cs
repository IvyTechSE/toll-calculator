namespace TollFeeCalculator;

public static class TollCalculator
{
    /**
     * Calculate the total toll fee for one day
     *
     * @param vehicle - the vehicle
     * @param dates   - date and time of all passes on one day
     * @return - the total toll fee for that day
     */

    public static int GetTollFee(IVehicle vehicle, DateTime[] dates)
    {
        if (vehicle.TollFree) return 0;

        var allDateFees = dates
            .Select(date => new DateFee(date, GetTollFee(date, vehicle)))
            .OrderByDescending(dateFee => dateFee.Fee)
            .ToList();

        var validFees = new List<DateFee>();
        foreach (var dateFee in allDateFees)
        {
            if (validFees.Any(validDateFee => validDateFee.SameHour(dateFee))) continue;

            validFees.Add(dateFee);
        }

        var totalFee = validFees.Sum(dateFee => dateFee.Fee);

        return Math.Min(totalFee, 60);
    }

    public static int GetTollFee(DateTime date, IVehicle vehicle)
    {
        if (TollFreeDate.IsTollFree(date) || vehicle.TollFree) return 0;

        return DayFeeCalculator.GetFee(date);
    }
}
