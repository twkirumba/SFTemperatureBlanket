public with sharing class WeatherService {
    // Replace with the actual API endpoint
    private static final String WEATHER_API_ENDPOINT = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

    // API Key for the weather service
    private static final String API_KEY = 'SPHYUYJGSBHXYPPY4DAP9Q6FJ';

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
}
