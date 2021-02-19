const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const request = require('request');
const cmd = require('node-cmd');

const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');

const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
// const NUMBER_PROMPT    = 'NUMBER_PROMPT';
// const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';

class UnlockPasswordDialog extends ComponentDialog {
    
    constructor(conservsationState,userState) {
        // unlockPasswordDialogDialog is a dialog id for the class UnlockPasswordDialog
        super('unlockPasswordDialog');

this.addDialog(new TextPrompt(TEXT_PROMPT));
this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
// this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.noOfParticipantsValidator));
// this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
    this.firstStep.bind(this),  // Ask confirmation if user wants to unlock password?
    this.getName.bind(this),    // Get name from user
    this.getIssue.bind(this),  // Issue details of an incident
    // this.getDate.bind(this), // Date of reservation
    // this.getTime.bind(this),  // Time of reservation
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to unlock password
    this.summaryStep.bind(this)
           
]));

this.initialDialogId = WATERFALL_DIALOG;

    }
// accessor is used to access different properties under dialog state object
    async run(turnContext, accessor) {
        var endDialog = false;
var continueRes = false;

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
        return await step.prompt(CONFIRM_PROMPT, 'Confirm if you want to unlock your password?', ['yes', 'no']);
              
        }
        
    async getName(step){
            
        console.log(step.result)
        if(step.result === true)
        { 
        return await step.prompt(TEXT_PROMPT, 'In what name incident for unlock password is to be created?');
        }
    
    }
        
    async getIssue(step){
            
        step.values.name = step.result
        return await step.prompt(TEXT_PROMPT, 'What is the issue with your password?');
    }
        
    async confirmStep(step){
    
        step.values.issue = step.result
        var msg = ` You have entered following values: \n Name: ${step.values.name}\n Issue: ${step.values.issue}`
        await step.context.sendActivity(msg);
        return step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to unloack your password?', ['yes', 'no']);
    }
        
    summaryStep(step){
        if(step.result===true)
            {            
            cmd.run("C:/Users/admin/AppData/Local/UiPath/app-20.10.2-beta0004/UiRobot.exe execute --file C:/Users/admin/Documents/UiPath/Unlock_password/Main.xaml")}
        }

    async isDialogComplete(){
        return endDialog;
        }
    }
        
    module.exports.UnlockPasswordDialog = UnlockPasswordDialog;
        