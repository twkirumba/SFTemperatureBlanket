public with sharing class BlanketAppService {
    //static methods to support the BlanketApp (currently LWC, could be Flow, etc)
    public static List<DateWeather__c> getDateWeatherByYear(Integer year){
        Date minDate = Date.newInstance(year, 01, 01);
        Date maxDate = minDate.addYears(+1).addDays(-1);
        return [SELECT Id, Date__c, Avg_Temp__c 
                FROM DateWeather__c 
                WHERE Date__c >= :minDate AND Date__c <= :maxDate ];
    }


    public static List<Blanket_Row__c> createBlanketForSchemeAndDateWeather(List<Color_Scheme_Item__c> colorSchemeItemList, List<DateWeather__c> dateWeatherList){
        List<Blanket_Row__c> blanketRowList = New List<Blanket_Row__c>();

        //iterate through dateWeatherList
        for(DateWeather__c dW : dateWeatherList){
            for(Color_Scheme_Item__c cSI : colorSchemeItemList){
                if(dW.Avg_Temp__c >= cSI.Min_Temp__c && dW.Avg_Temp__c <= cSI.Max_Temp__c){
                    blanketRowList.add(createBlanketRow(dW, cSI));
                    break;
                }
            }
        }
        return blanketRowList;
    }

    private static Blanket_Row__c createBlanketRow(DateWeather__c dW, Color_Scheme_Item__c cSI){
        //ideally, associating by object instead of Id lets the values carry over and be readable in the LWC
        return New Blanket_Row__c(
            DateWeather__r = dW,
            Color_Scheme_Item__r = cSI
        );
    }

    @AuraEnabled(cacheable=true)
    public static List<Blanket_Row__c> createBlanketForSchemeAndDateWeather(List<Color_Scheme_Item__c> colorSchemeItemList, Integer year){
        System.debug(colorSchemeItemList);

        return createBlanketForSchemeAndDateWeather(colorSchemeItemList, getDateWeatherByYear(year));
    }

    public BlanketAppService() {
    }
}