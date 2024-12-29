Date dt = Date.newInstance(2024,12,18);
System.debug(dt);
System.debug(dt.format());
System.debug(String.valueOf(dt));
System.debug(WeatherService.fetchWeatherData('01562', Date.newInstance(2024,01,01), Date.newInstance(2024,12,31)).size() + ' days of weather retrieved');