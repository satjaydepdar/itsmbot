const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');
const request = require('request');

const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const {CardFactory} = require('botbuilder');
const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';
var continueRes ='';
var ticket_id = ""
class GetTicketStatusDialog extends ComponentDialog {
	constructor(conversationState,userState) {
		super('getTicketStatusDialog');
		this.addDialog(new TextPrompt(TEXT_PROMPT));
		this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
		this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
		this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
			// this.firstStep.bind(this),  // Ask confirmation if user wants to get ticket status?
			this.confirmStep.bind(this), 
			// this.get_ticket.bind(this),
			this.summaryStep.bind(this),
			this.endStep.bind(this)
		]));
		this.initialDialogId = WATERFALL_DIALOG;
	}
	async run(turnContext, accessor, ticket) {
		continueRes = false;
		endDialog = false;
		ticket_id = ticket
		const dialogSet = new DialogSet(accessor);
		dialogSet.add(this);

		const dialogContext = await dialogSet.createContext(turnContext);
		const results = await dialogContext.continueDialog();
		if (results.status === DialogTurnStatus.empty) {
			await dialogContext.beginDialog(this.id);
		}
	}

	async confirmStep(step){
	    step.values.ticketNo = ticket_id
	    var msg = "The Ticket Number entered is: " + step.values.ticketNo
	    await step.context.sendActivity(msg);
	    return await step.prompt(CONFIRM_PROMPT, 'Are you sure the ticket number is correct?', ['yes', 'no']);
	
	}
	async summaryStep(step){
		if(step.result == false){
			await step.context.sendActivity({text: 'Please try again with the correct ticket ID'});
			return await step.prompt(CONFIRM_PROMPT, 'Do you want to try again?', ['yes', 'no']);
		}else{
			console.log("Ticket ID: " + step.values.ticketNo)
			var username = "meapi"; 
			var password = "admin@123";

			var authenticationHeader = "Basic " + Buffer.from(username + ":" + password).toString("base64");
			
			let options = {
				url: "https://dev-support.happiestminds.com/api/v3/requests/" + step.values.ticketNo,
				headers : { "TECHNICIAN_KEY" : "F3776882-8E92-432B-8FD3-C39A6E7CEB18"}
			};
			var ticketStatus;
			await request.get(options, async (err, res, body) => {
				if(err){
					console.log(err)
				}
				console.log(body)
				let response = JSON.parse(body);
				console.log(response)
				if(response.response_status.status == "failed"){
					ticketStatus = "Ticket ID entered is invalid. Please try again"	
				}else{
					ticketStatus = response.request['status'];
					ticketStatus = "Status of the ticket is: " + ticketStatus.name
				}
			});
			await new Promise(resolve => setTimeout(async() => resolve(
				await step.context.sendActivity(ticketStatus)
			), 4000));
			return await step.prompt(CONFIRM_PROMPT, 'Do you want to try again?', ['yes', 'no'])
		}
	}
	async endStep(step){
		if(step.result===true){            
				continueRes = true;
				endDialog = true;
				return await step.endDialog();                 
		}else{
			var msg = `Thank you for using ITSM bot`
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

module.exports.GetTicketStatusDialog = GetTicketStatusDialog;
