import { LightningElement, api, track, wire } from 'lwc';
import getColorSchemesWithItemsById from '@salesforce/apex/BlanketAppService.getColorSchemesWithItemsById';
import getDateWeatherByDate from '@salesforce/apex/WeatherService.getDateWeatherByDate';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import { getRecord, updateRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'Color_Scheme__c.Last_Knit_Date__c'
];




export default class BlanketApp_BlanketManager extends LightningElement {

    @api recordId;
    recordData;
    error;
    colorDate;
    colorDateStyle;
    avgTemp;
    colorName;
    previewBlanket = false;
    @track listOfAccounts;
    @track listOfAccountsJSON;
    year;
    getWeatherByDateViaApex = false;
    fontColor;

    get lastKnitDate(){
        return this.recordData?.fields.Last_Knit_Date__c.value;
    }

    connectedCallback(){
        this.colorDate = new Date().toISOString();
        this.year = new Date().getFullYear();
        this.loadDataFromRecordId();
        this.listOfAccountsJSON = JSON.stringify(this.listOfAccounts);
        console.dir(this.listOfAccounts);
        this.setColorDateStyle();
    }

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            console.log(JSON.stringify(data));
            this.recordData = data; // Store the retrieved record data
            this.error = undefined;
        } else if (error) {
            this.error = error; // Handle the error
            this.recordData = {fields: {
                Last_Knit_Date__c : {
                    value: new Date(new Date().getFullYear(), 0, 1)
                }
            }};
        }
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
                this.fontColor = `color: ${this.getTextColor(matchingColorScheme.Color__c)};`;
                console.log(this.fontColor);
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

    handleLastKnitDateChange(event) {
        //update the record's Last_Knit_Date__c from the event detail
        console.log(JSON.stringify(event));
        const fields = {};
        fields['Id'] = this.recordId;
        fields['Last_Knit_Date__c'] = event.detail;

        const recordInput = { fields };

        updateRecord(recordInput)
        .then(() => {
            this.showNotification('Success', `Last Knit Date successfully updated to ${event.detail}`, 'success');
        })
        .catch(error => {
            this.showNotification('Error', 'Failed to update Last Knit Date', 'error');
            console.error('Error updating record: ', error);
        });
    }

    getTextColor(backgroundColor) {
        // Convert hex to RGB
        const r = parseInt(backgroundColor.substr(1,2), 16);
        const g = parseInt(backgroundColor.substr(3,2), 16);
        const b = parseInt(backgroundColor.substr(5,2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black for light backgrounds, white for dark
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

}