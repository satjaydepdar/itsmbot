const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const request = require('request');

const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var continueRes = '';
var endDialog = '';

class CloseTicketDialog extends ComponentDialog {
	constructor(conversationState, userState) {
		super('closeTicketDialog');

		this.addDialog(new TextPrompt(TEXT_PROMPT));
		this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
		this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

		this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
			this.firstStep.bind(this),
			this.getTicketID.bind(this),
			this.getReason.bind(this),
			this.confirmStep.bind(this),
			this.summaryStep.bind(this),
			this.endStep.bind(this)
			// this.summaryStep.bind(this)

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

	async firstStep(step) {
		endDialog = false;
		return await step.prompt(CONFIRM_PROMPT, 'Would you like to close a ticket?', ['yes', 'no']);

	}

	async getTicketID(step) {
		if (step.result == true) {
			return await step.prompt(TEXT_PROMPT, 'Provide the TicketID');
		}
	}

	async getReason(step) {
		step.values.ticket_ID = step.result
		console.log(step.values.ticket_ID)
		return await step.prompt(TEXT_PROMPT, 'Provide reason for closing the ticket');
	}

	async confirmStep(step) {
		step.values.reason = step.result
		var msg = ` You have provide the following ticket id: ${step.values.ticket_ID} \n Issue: ${step.values.reason} \n`
		await step.context.sendActivity(msg);
		return await step.prompt(CONFIRM_PROMPT, 'Are you sure want to close the ticket?', ['yes', 'no']);
	}
	async summaryStep(step) {
		console.log(step.values.reason)
		if (step.result === true) {
			let options = {
				url: "https://dev-support.happiestminds.com/api/v3/requests/" + step.values.ticket_ID + "/close",
				headers: {
					"TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18",
					"Content-Type": "application/x-www-form-urlencoded"
				},
				form: {
					input_data: '{"request": {"closure_info": {"requester_ack_resolution": true,"requester_ack_comments": "Mail fetching is up and running now","closure_comments": "' + step.values.reason + '","closure_code": {"name": "success"}}}}'
				}
			};
			let message = ""
			await request.put(options, async (err, res, body) => {
				let response = JSON.parse(body);
				if (response["response_status"]["messages"][0]["message"] == "Invalid URL") {
					message = "Not a valid Ticket ID entered"
				} else if (response["response_status"]["messages"][0]["message"] == "Request is already closed") {
					message = "Ticket is already closed"
				} else {
					message = "Ticket closed successfully"
				}
			});
			await new Promise(resolve => setTimeout(async () => resolve(
				await step.context.sendActivity(message)
			), 6000));
			return await step.prompt(CONFIRM_PROMPT, 'Do you want to contiue using the ITSM bot?', ['yes', 'no'])
		}
	}

	async endStep(step) {
		if (step.result === true) {
			continueRes = true;
			endDialog = true;
			return await step.endDialog();
		} else {
			var msg = `Thank you for using ITSM bot`
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
