public with sharing class WeatherServiceSchedulable implements Schedulable {

    private String zipCode;
    private Date fromDate;
    private Date toDate;

    public WeatherServiceSchedulable(String zipCode, Date fromDate, Date toDate) {
        this.zipCode = zipCode;
        this.fromDate = fromDate;
        this.toDate = toDate;
    }

    public void execute(SchedulableContext sc) {
        // Call the fetchWeatherData method of the WeatherService class
        WeatherService.fetchWeatherData(this.zipCode, this.fromDate, this.toDate);
    }
}