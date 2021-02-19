const { ActivityHandler, MessageFactory } = require('botbuilder');
const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const request = require('request');
const cmd = require('node-cmd');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const mysql = require('mysql');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = false;
var continueRes = false;

class ResetPasswordDialog extends ComponentDialog {

	constructor(conservsationState, userState) {
		// unlockPasswordDialogDialog is a dialog id for the class ResetPasswordDialog
		super('resetPasswordDialog');

		this.addDialog(new TextPrompt(TEXT_PROMPT));
		this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
		this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

		this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
			this.getName.bind(this),    // Get name from user
			this.getIssue.bind(this),  // Issue details of an incident
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

	async getName(step) {
		return await step.prompt(TEXT_PROMPT, 'Sure. I will guide you through the process. In whose name would you like to create the ticket?');
	}

	async getIssue(step) {
		step.values.name = step.result
		return await step.prompt(TEXT_PROMPT, 'Why do you want to reset your password?');
	}

	async summaryStep(step) {
		step.values.issue = step.result
		//Create	
		// let options = {
		// 	url: "https://dev-support.happiestminds.com/api/v3/requests/",
		// 	headers: {
		// 		"TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18",
		// 		"Content-Type": "application/x-www-form-urlencoded"
		// 	},
		// 	form: {
		// 		input_data: '{"request":{"subject":"' + step.values.issue + '","description":"' + step.values.issue + '","requester":{"name":' + step.values.name + '}}}'
		// 	}
		// };
		// var inc_id;
		// await request.post(options, async (err, res, body) => {
		// 	console.log(body)
		// 	if (err) {
		// 		console.log(err)
		// 	} else {
		// 		let response = JSON.parse(body);
		// 		inc_id = response.request['id'];
		// 	}
		// });
		await new Promise(resolve => setTimeout(async () => resolve(
			await step.context.sendActivity("Ok. Open the URL link https://passwordreset.microsoftonline.com/ and follow the instructions to reset your password.")
		), 1000));
		// await new Promise(resolve => setTimeout(async () => resolve(
		// 	await step.context.sendActivity("Ok. A service request with ticket id " + inc_id + " is raised with a password reset request. Open the URL link https://passwordreset.microsoftonline.com/ and follow the instructions to reset your password.")
		// ), 5000));
		//Close
		// let options1 = {
		// 	url: "https://dev-support.happiestminds.com/api/v3/requests/" + inc_id + "/close",
		// 	headers: {
		// 		"TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18",
		// 		"Content-Type": "application/x-www-form-urlencoded"
		// 	},
		// 	form: {
		// 		input_data: '{"request": {"closure_info": {"requester_ack_resolution": true,"requester_ack_comments": "Password reset steps provided","closure_comments": "Password reset steps provided","closure_code": {"name": "success"}}}}'
		// 	}
		// };
		// let message = ""
		// await request.put(options1, async (err, res, body) => {
		// });
		return await step.prompt(CONFIRM_PROMPT, 'Anything else?', ['yes', 'no']);
	}
	async endStep(step) {
		console.log(step.result)
		if (step.result === true) {
			continueRes = true;
			endDialog = true;
			return await step.endDialog();
		} else {
			var reply = MessageFactory.suggestedActions(['Satisfied', 'Not Satisfied', 'Happy', 'Need to improve'], "Thank you for reaching out. Pls share the feedback for this session. ");
			await step.context.sendActivity(reply);
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

module.exports.ResetPasswordDialog = ResetPasswordDialog;