const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const request = require('request');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
// const NUMBER_PROMPT    = 'NUMBER_PROMPT';
// const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';
var continueRes = '';
var url = ""

class UnblockURLDialog extends ComponentDialog {

    constructor(conservsationState, userState) {
        super('UnblockURLDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.getName.bind(this),    // Get name from user
            this.summaryStep.bind(this),
            this.endStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
    async run(turnContext, accessor, blocked_url) {
        url = blocked_url
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async getName(step) {
        step.values.url = url;
        var msg = "The URL entered is: " + step.values.url
	    await step.context.sendActivity(msg);
	    return await step.prompt(CONFIRM_PROMPT, 'Are you sure you want to unblock this URL?', ['yes', 'no']);
    }
    async summaryStep(step) {
        if (step.result === true) {
            let options = {
                url: "https://dev-support.happiestminds.com/api/v3/requests/",
                headers: {
                    "TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                form: {
                    input_data: '{"request":{"subject":"UnBlock URL","description":"URL: ' + step.values.url + '","requester":{"name":' + step.values.name + '}}}'
                }
            };
            var inc_id;
            await request.post(options, async (err, res, body) => {
                let response = JSON.parse(body);
                console.log(response)
                inc_id = response.request['id'];
                console.log(inc_id)
            });
            await new Promise(resolve => setTimeout(async () => resolve(
                await step.context.sendActivity("Incident for unblocking url successfully created. Your incident id is : " + inc_id)
                // console.log()
            ), 6000));
            await step.context.sendActivity("You will receive a mail once the URL is unblocked");
            return await step.prompt(CONFIRM_PROMPT, 'Do you want to try again?', ['yes', 'no'])
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
module.exports.UnblockURLDialog = UnblockURLDialog;
