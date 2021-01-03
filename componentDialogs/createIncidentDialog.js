const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const request = require('request');
const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
// const NUMBER_PROMPT    = 'NUMBER_PROMPT';
// const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';

class CreateIncidentDialog extends ComponentDialog {
    
    constructor(conservsationState,userState) {
        // cretateIncidentDialog is a dialog id for the class CreateIncidentDialog
        super('createIncidentDialog');

this.addDialog(new TextPrompt(TEXT_PROMPT));
this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
// this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.noOfParticipantsValidator));
// this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
    this.firstStep.bind(this),  // Ask confirmation if user wants to create incident request?
    this.getName.bind(this),    // Get name from user
    this.getIssue.bind(this),  // Issue details of an incident
    // this.getDate.bind(this), // Date of reservation
    // this.getTime.bind(this),  // Time of reservation
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to create incident
    this.summaryStep.bind(this)
           
]));

this.initialDialogId = WATERFALL_DIALOG;

    }
// accessor is used to access different properties under dialog state object
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
    
        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async firstStep(step) {
        endDialog = false;
        // Running a prompt here means the next WaterfallStep will be run when the users response is received.
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to create an incident?', ['yes', 'no']);
              
        }
        
    async getName(step){
            
        console.log(step.result)
        if(step.result === true)
        { 
        return await step.prompt(TEXT_PROMPT, 'In what name incident is to be created?');
        }
    
    }
        
    async getIssue(step){
            
        step.values.name = step.result
        return await step.prompt(TEXT_PROMPT, 'Provide details of the issue you face?');
    }         
        
    async confirmStep(step){    
        step.values.issue = step.result
        var msg = ` You have entered following values: \n Name: ${step.values.name}\n Issue: ${step.values.issue}`
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to create an incident?', ['yes', 'no']);
    }        
    async summaryStep(step){
        if(step.result===true)
        {
            // Business 
            // Include the request library for Node.js   
            
            //  Basic Authentication credentials   
            var username = "meapi"; 
            var password = "admin@123";

            var authenticationHeader = "Basic " + new Buffer(username + ":" + password).toString("base64");
           
            let options = {
                url: "https://dev-support.happiestminds.com/api/v3/requests/",
                headers : { "TECHNICIAN_KEY" : "4476682D-B7C1-4B26-909C-4671A0E46407",
                            "Content-Type" : "application/x-www-form-urlencoded"},
                form: {
                    input_data : '{"request":{"subject":"'+step.values.issue+'","description":"'+step.values.issue+'","requester":{"name":'+step.values.name+'}}}'
                }
            };

            var inc_id;

            await request.post(options, async (err, res, body) => {
                    //console.log(res);
                    let response = JSON.parse(body);
                    inc_id = response.request['id'];
                    console.log(inc_id);
                    await step.context.sendActivity("Incident successfully created. Your incident id is : "+inc_id);
                    

                });

                // await new Promise(resolve => setTimeout(async() => resolve(
                //     await step.context.sendActivity("Incident successfully created. Your incident id is : "+inc_id)
                // ), 1000));
                endDialog = true;
                await step.endDialog();          
        
        }
          
    }
    
    async isDialogComplete(){
        return endDialog;
    }
    }
        
    module.exports.CreateIncidentDialog = CreateIncidentDialog;
        