const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const request = require('request');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = false;
var continueRes = false;
class CloseTicketDialog extends ComponentDialog {
	constructor(conversationState, userState) {
		super('closeTicketDialog');

		this.addDialog(new TextPrompt(TEXT_PROMPT));
		this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
		this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

		this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
			this.getTicketID.bind(this),
			this.getReason.bind(this),
			this.summaryStep.bind(this),
			this.endStep.bind(this)
		]));

		this.initialDialogId = WATERFALL_DIALOG;
	}
	async run(turnContext, accessor) {
		const dialogSet = new DialogSet(accessor);
		dialogSet.add(this);

		const dialogContext = await dialogSet.createContext(turnContext);
		const results = await dialogContext.continueDialog();
		if (results.status === DialogTurnStatus.empty) {
			await dialogContext.beginDialog(this.id);
		}
	}
	async getTicketID(step) {
		return await step.prompt(TEXT_PROMPT, 'Sure. I will guide you through the process. What is the service ticket number for which you would like the status?');
	}

	async getReason(step) {
		step.values.ticket_ID = step.result
		console.log(step.values.ticket_ID)
		return await step.prompt(TEXT_PROMPT, 'Why do you want to close this request?');
	}

	async summaryStep(step) {
		step.values.reason = step.result
		console.log(step.values.reason)
		let options = {
			url: "https://dev-support.happiestminds.com/api/v3/requests/" + step.values.ticket_ID + "/close",
			headers: {
				"TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18",
				"Content-Type": "application/x-www-form-urlencoded"
			},
			form: {
				input_data: '{"request": {"closure_info": {"requester_ack_resolution": true,"requester_ack_comments": "' + step.values.reason + '" ,"closure_comments": "' + step.values.reason + '","closure_code": {"name": "success"}}}}'
			}
		};
		let message = ""
		await request.put(options, async (err, res, body) => {
			let response = JSON.parse(body);
			if (response["response_status"]["messages"][0]["message"] == "Invalid URL") {
				message = "Are you sure of the ticket no. There is no request with such a number in our system. Pls share a valid ticket number."
			} else if (response["response_status"]["messages"][0]["message"] == "Request is already closed") {
				message = "Ticket is already closed"
			} else {
				message = "Ok. Request " + step.values.ticket_ID + " is now closed in the system. Thank you for reaching out. Pls share the feedback for this session."
			}
		});
		await new Promise(resolve => setTimeout(async () => resolve(
			await step.context.sendActivity(message)
		), 6000));
		return await step.prompt(CONFIRM_PROMPT, 'Anything else?', ['yes', 'no'])
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

module.exports.CloseTicketDialog = CloseTicketDialog;
