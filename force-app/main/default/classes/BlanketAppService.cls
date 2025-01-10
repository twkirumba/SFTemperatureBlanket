public with sharing class BlanketAppService {
    //static methods to support the BlanketApp (currently LWC, could be Flow, etc)
    public static List<DateWeather__c> getDateWeatherByYear(Integer year){
        Date minDate = Date.newInstance(year, 01, 01);
        Date maxDate = minDate.addYears(+1).addDays(-1);
        return [SELECT Id, Date__c, Avg_Temp__c 
                FROM DateWeather__c 
                WHERE Date__c >= :minDate AND Date__c <= :maxDate 
                ORDER BY Date__c ASC];
    }


    public static List<Blanket_Row__c> createBlanketForSchemeAndDateWeather(List<Color_Scheme_Item__c> colorSchemeItemList, List<DateWeather__c> dateWeatherList){
        List<Blanket_Row__c> blanketRowList = New List<Blanket_Row__c>();

        //iterate through dateWeatherList
        for(DateWeather__c dW : dateWeatherList){
            for(Color_Scheme_Item__c cSI : colorSchemeItemList){
                if(Math.round(dW.Avg_Temp__c) >= cSI.Min_Temp__c && Math.round(dW.Avg_Temp__c) <= cSI.Max_Temp__c){
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

    @AuraEnabled(cacheable=false)
    public static List<Blanket_Row__c> createBlanketForSchemeAndDateWeather(List<Color_Scheme_Item__c> colorSchemeItemList, Integer year){
        return createBlanketForSchemeAndDateWeather(colorSchemeItemList, getDateWeatherByYear(year));
    }

    @AuraEnabled
    public static Color_Scheme__c saveColorScheme(List<Color_Scheme_Item__c> colorSchemeItemList, String colorSchemeName, Id recordId){
        try {
            Color_Scheme__c colorScheme = New Color_Scheme__c(Name = colorSchemeName);
            if(recordId != null){
                colorScheme.Id = recordId;
            }
            upsert colorScheme;
            for(Color_Scheme_Item__c cSI : colorSchemeItemList){
                cSI.Color_Scheme__c = colorScheme.Id;
            }
            upsert colorSchemeItemList;
            return colorScheme;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable = true)
    public static Color_Scheme__c getColorSchemesWithItemsById(Id colorSchemeId){
        try{
            Color_Scheme__c colorScheme = [SELECT Id, Name, (SELECT Id, Color_Scheme__c, Min_Temp__c, Max_Temp__c, Color__c, Color_Name__c FROM Color_Scheme_Items__r) FROM Color_Scheme__c WHERE Id = :colorSchemeId];
            return colorScheme;
        }catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }

    public BlanketAppService() {
    }
}