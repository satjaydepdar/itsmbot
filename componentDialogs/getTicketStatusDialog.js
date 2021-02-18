const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const request = require('request');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = false;
var continueRes = false;

class GetTicketStatusDialog extends ComponentDialog {
	constructor(conversationState, userState) {
		super('getTicketStatusDialog');
		this.addDialog(new TextPrompt(TEXT_PROMPT));
		this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
		this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
		this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
			this.getName.bind(this),
			this.summaryStep.bind(this),
			this.endStep.bind(this)
		]));
		this.initialDialogId = WATERFALL_DIALOG;
	}
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

	async getName(step) {
		return await step.prompt(TEXT_PROMPT, 'Sure. I will guide you through the process. What is the service ticket number for which you would like the status?');
	}

	async summaryStep(step) {
		step.values.ticketNo = step.result
		console.log("Ticket ID: " + step.values.ticketNo)
		var username = "meapi";
		var password = "admin@123";

		var authenticationHeader = "Basic " + Buffer.from(username + ":" + password).toString("base64");

		let options = {
			url: "https://dev-support.happiestminds.com/api/v3/requests/" + step.values.ticketNo,
			headers: { "TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18" }
		};
		var ticketStatus;
		await request.get(options, async (err, res, body) => {
			if (err) {
				console.log(err)
			}
			console.log(body)
			let response = JSON.parse(body);
			console.log(response)
			if (response.response_status.status == "failed") {
				ticketStatus = "Are you sure of this ticket no. There is no request with such a number in our system. Pls share a valid request number."
			} else {
				ticketStatus = response.request['status'];
				ticketStatus = "The request " + step.values.ticketNo + " is " + ticketStatus.name + ". It is being attended to by "+ response.request['technician']["name"] +" who can be reached at "+  response.request['technician']["email_id"] +" for any specific clarifications"
			}
		});
		await new Promise(resolve => setTimeout(async () => resolve(
			await step.context.sendActivity(ticketStatus)
		), 6000));
		return await step.prompt(CONFIRM_PROMPT, 'Anything else?', ['yes', 'no'])
		// }
	}
	async endStep(step) {
		if (step.result === true) {
			continueRes = true;
			endDialog = true;
			return await step.endDialog();
		} else {
			var msg = `Thank you for reaching out. Pls share the feedback for this session.`
			step.context.sendActivity(msg);
			continueRes = false;
			endDialog = true;
			return await step.endDialog();
		}
	}
	async isDialogComplete() {
		return endDialog;
	}

	async continueActions() {
		return continueRes;
	}
}

module.exports.GetTicketStatusDialog = GetTicketStatusDialog;
