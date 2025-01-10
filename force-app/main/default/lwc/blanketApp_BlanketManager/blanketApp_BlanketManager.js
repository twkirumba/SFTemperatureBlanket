import { LightningElement, api, track } from 'lwc';
import getColorSchemesWithItemsById from '@salesforce/apex/BlanketAppService.getColorSchemesWithItemsById';
import getDateWeatherByDate from '@salesforce/apex/WeatherService.getDateWeatherByDate';
import {ShowToastEvent} from "lightning/platformShowToastEvent";




export default class BlanketApp_BlanketManager extends LightningElement {

    @api recordId;
    colorDate;
    colorDateStyle;
    avgTemp;
    colorName;
    previewBlanket = false;
    @track listOfAccounts;
    @track listOfAccountsJSON;
    year;
    getWeatherByDateViaApex = false;

    connectedCallback(){
        this.colorDate = new Date().toISOString();
        this.year = new Date().getFullYear();
        this.loadDataFromRecordId();
        this.listOfAccountsJSON = JSON.stringify(this.listOfAccounts);
        console.dir(this.listOfAccounts);
        this.setColorDateStyle();
    }

    setColorDateStyle(){
        //call WireService and pass in colorDate to get Avg. Temp
        this.getWeatherByDate()
            .then(data => {
                console.log(data);
                this.avgTemp = data.Avg_Temp__c;
                let matchingColorScheme = this.getColorForTemperature(this.avgTemp);
                this.colorDateStyle = 'background-color: ' + matchingColorScheme.Color__c;
                this.colorName = matchingColorScheme.Color_Name__c;
            })
            .catch(error => {
                console.dir(error);
                this.showNotification('Error', 'Failed to set color by date')
            });
    }

    getColorForTemperature(avgTemp) {
        for (let item of this.listOfAccounts) {
            if (Math.round(avgTemp) >= item.Min_Temp__c && Math.round(avgTemp) <= item.Max_Temp__c) {
                return item; 
            }
        }
        return null; 
    }

    handleDateChange(event) {
        this.colorDate = event.target.value;
        this.setColorDateStyle();
    }
    loadDataFromRecordId(){
        //wire_service: query colorscheme with colorschemeItems
        getColorSchemesWithItemsById({colorSchemeId: this.recordId})
            .then((data) => {
                console.dir(data);
                this.setListOfAccounts(data.Color_Scheme_Items__r);
                this.previewBlanket = true;               
            })
            .catch((error) => {
                console.dir(error);
                this.showNotification('Error', 'Failed to load color scheme', 'error')
            });
    }
    setListOfAccounts(colorSchemeItems){
        this.listOfAccounts = colorSchemeItems.map((item, index) => ({
            index: index,
            Min_Temp__c: parseFloat(item.Min_Temp__c.toFixed(2)),
            Max_Temp__c: parseFloat(item.Max_Temp__c.toFixed(2)),
            Color__c: item.Color__c,
            Color_Name__c: item.Color_Name__c,
            Id: item.Id
        }));
    }
    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
    getWeatherByDate(){
        const dateWeatherApex = getDateWeatherByDate({dateString: this.colorDate});
        const dateWeatherAPI = this.fetchWeatherData(this.colorDate);
        console.log('get weather by date via apex: ' + JSON.stringify(dateWeatherApex));
        console.log('get weather by date via API: ' + JSON.stringify(dateWeatherAPI));
        if(this.getWeatherByDateViaApex){            
            return dateWeatherApex;
        }
        return dateWeatherAPI;
    }
    fetchWeatherData(dateString) {
        const apiKey = 'SPHYUYJGSBHXYPPY4DAP9Q6FJ';
        const url = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/01562/' + dateString + '/' + dateString + '?unitGroup=us&elements=datetime%2Ctemp&include=days%2Cobs&key=' + apiKey + '&contentType=json';
        console.log('fetching weather data from: ' + url);
        return fetch(url)
        .then(response => {
            if (!response.ok) {
                console.log('HTTP error! status: ' + response.status);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            console.log('response: ' + JSON.stringify(response));
            return response.json();
        })
        .then(jsonResponse => {
            // Parse the response to extract Avg_Temp__c
            return { Avg_Temp__c: jsonResponse.days[0].temp };
        })
        .catch(error => {
            return {error: error.message };
        });
    }
}