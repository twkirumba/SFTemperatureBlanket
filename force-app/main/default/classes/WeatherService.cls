public with sharing class WeatherService {
    // Replace with the actual API endpoint
    private static final String WEATHER_API_ENDPOINT = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

    // API Key for the weather service
    private static final String API_KEY = 'SPHYUYJGSBHXYPPY4DAP9Q6FJ';

    /**
     * Invocable method to fetch weather data from a Flow.
     * @param request List of ZipCodeDateRange objects containing ZIP code and date range.
     * @return List of List<DateWeather__c> containing the fetched weather data.
     */
    @InvocableMethod(label='Fetch Weather Data' description='Fetches weather data for the specified ZIP code and date range.')
    public static List<List<DateWeather__c>> fetchWeatherDataFromFlow(List<ZipCodeDateRange> request) {
        List<List<DateWeather__c>> result = new List<List<DateWeather__c>>();
        for (ZipCodeDateRange zipCodeDateRange : request) {
            String zipCode = zipCodeDateRange.zipCode;
            Date fromDate = zipCodeDateRange.fromDate;
            Date toDate = zipCodeDateRange.toDate;
            result.add(fetchWeatherData(zipCode, fromDate, toDate));
        }
        return result;
    }

    /**
     * Fetch weather data for the last 15 days for a given ZIP code.
     * @param zipCode The ZIP code to fetch weather data for.
     * @return List of DateWeather objects parsed from the response.
     */
    @AuraEnabled(cacheable=true)
    public static List<DateWeather__c> fetchWeatherData(String zipCode, Date fromDate, Date toDate) {
        String url = WEATHER_API_ENDPOINT + zipCode + '/' + String.valueOf(fromDate) + '/' + String.valueOf(toDate) + '?unitGroup=us&elements=datetime%2Ctemp&include=days%2Cobs&key=' + API_KEY + '&contentType=json';
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(url);
        request.setMethod('GET');

        try {
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                return parseWeatherData(response.getBody(), zipCode);
            } else {
                throw new CalloutException('Failed to fetch weather data. Status: ' + response.getStatusCode() + ', Body: ' + response.getBody());
            }
        } catch (Exception e) {
            throw new CalloutException('Error during callout: ' + e.getMessage());
        }
    }

    //TODO: This could cause bugs because of the zip code if there are multiple users. 
    @AuraEnabled(cacheable=true)
    public static DateWeather__c getDateWeatherByDate(String dateString){
        try {
            Date dt = Date.valueOf(dateString);
            return [SELECT Id, Date__c, Avg_Temp__c
                    FROM DateWeather__c 
                    WHERE Date__c = :dt];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Parse weather data from the JSON response.
     * @param responseBody The JSON response body.
     * @param zipCode The ZIP code for the data.
     * @return List of DateWeather__c records.
     */
    private static List<DateWeather__c> parseWeatherData(String responseBody, String zipCode) {
        List<DateWeather__c> weatherRecords = new List<DateWeather__c>();
        Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
        List<Object> days = (List<Object>) jsonResponse.get('days');

        for (Object dayObj : days) {
            Map<String, Object> day = (Map<String, Object>) dayObj;
            Date dt = Date.valueOf((String) day.get('datetime'));
            Decimal temp = (Decimal) day.get('temp');

            // Construct external ID
            String externalId = dt.format() + '-' + zipCode;

            // Create DateWeather__c record
            DateWeather__c weatherRecord = new DateWeather__c();
            weatherRecord.Date__c = dt;
            weatherRecord.Zip_Code__c = zipCode;
            weatherRecord.Avg_Temp__c = temp;
            weatherRecord.ExternalId__c = externalId;

            weatherRecords.add(weatherRecord);
        }

        // Insert records in Salesforce
        upsert weatherRecords ExternalId__c; // Use an External ID field for upsert
        return weatherRecords;
    }

    /**
     * Inner class representing a ZIP code and date range.
     */
    public class ZipCodeDateRange {
        @InvocableVariable(label='ZIP Code' required=true)
        public String zipCode;
        @InvocableVariable(label='From Date' required=true)
        public Date fromDate;
        @InvocableVariable(label='To Date' required=true)
        public Date toDate;
    }
}
