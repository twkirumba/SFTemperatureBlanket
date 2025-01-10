public with sharing class WeatherServiceSchedulable implements Schedulable {

    private String zipCode;
    private Date fromDate;
    private Date toDate;

    public WeatherServiceSchedulable() {
        //Calls weather service to get yesterday's weather data
        this.zipCode = '01562';
        this.fromDate = Date.today().addDays(-1);
        this.toDate = fromDate;
    }

    public void execute(SchedulableContext sc) {
        // Call the fetchWeatherData method of the WeatherService class
        WeatherService.fetchWeatherData(this.zipCode, this.fromDate, this.toDate);
    }
}