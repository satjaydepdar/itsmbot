const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const request = require('request');
const cmd = require('node-cmd');

const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const mysql = require('mysql');

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';
var continueRes ='';

class ResetPasswordDialog extends ComponentDialog {
	
	constructor(conservsationState,userState) {
		// unlockPasswordDialogDialog is a dialog id for the class ResetPasswordDialog
		super('resetPasswordDialog');

		this.addDialog(new TextPrompt(TEXT_PROMPT));
		this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
		this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

		this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
			// this.firstStep.bind(this),  // Ask confirmation if user wants to unlock password?
			this.getName.bind(this),    // Get name from user
			this.getIssue.bind(this),  // Issue details of an incident
			this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to unlock password
			this.summaryStep.bind(this),
			this.endStep.bind(this)
		]));

		this.initialDialogId = WATERFALL_DIALOG;

	}
// accessor is used to access different properties under dialog state object
	async run(turnContext, accessor) {
		continueRes = false;
		endDialog = false;
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
		return await step.prompt(CONFIRM_PROMPT, 'Confirm if you want to reset your password?', ['yes', 'no']);
			  
	}
		
	async getName(step){
		return await step.prompt(TEXT_PROMPT, 'In what name incident for reset password is to be created?');	
	}
		
	async getIssue(step){
		step.values.name = step.result
		return await step.prompt(TEXT_PROMPT, 'What is the issue with your password?');
	}
		
	async confirmStep(step){	
		step.values.issue = step.result
		var msg = ` You have entered following values: \n Name: ${step.values.name}\n Issue: ${step.values.issue}`
		await step.context.sendActivity(msg);
		return step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to reset your password?', ['yes', 'no']);
	}
		
	async summaryStep(step){
		if(step.result===true){            
			var msg = `${step.values.name} open the URL link https://passwordreset.microsoftonline.com/ and follow the instructions to reset your password.`
			step.context.sendActivity(msg); 
			return await step.prompt(CONFIRM_PROMPT, 'Do you want to continue using the chatbot?', ['yes', 'no']);
		}
	}
		async endStep(step){
			if(step.result===true)
				{            
					continueRes = true;
					endDialog = true;
					return await step.endDialog();                 
				}else{
					var msg = `${step.values.name}, Thank you for using ITSM bot`
					step.context.sendActivity(msg);
					continueRes = false;
					endDialog = true;
					return await step.endDialog();
				}
			}


	async isDialogComplete(){
		return endDialog;
		}

	async continueActions(){
		return continueRes;
		}
}
		
	module.exports.ResetPasswordDialog = ResetPasswordDialog;