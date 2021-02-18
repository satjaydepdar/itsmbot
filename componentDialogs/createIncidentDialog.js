const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');
const request = require('request');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = false;
var continueRes = false;

class CreateIncidentDialog extends ComponentDialog {

    constructor(conservsationState, userState) {
        super('createIncidentDialog');
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
    async run(turnContext, accessor) {
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
        return await step.prompt(TEXT_PROMPT, 'Ok. ' + step.values.name + ' is a valid user in the system. What would you like to add in the body of the request?');
    }

    async summaryStep(step) {
        let options = {
            url: "https://dev-support.happiestminds.com/api/v3/requests/",
            headers: {
                "TECHNICIAN_KEY": "F3776882-8E92-432B-8FD3-C39A6E7CEB18",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            form: {
                input_data: '{"request":{"subject":"' + step.values.issue + '","description":"' + step.values.issue + '","requester":{"name":' + step.values.name + '}}}'
            }
        };
        var inc_id;
        await request.post(options, async (err, res, body) => {
            console.log(body)
            if (err) {
                console.log(err)
            } else {
                let response = JSON.parse(body);
                inc_id = response.request['id'];
            }
        });
        await new Promise(resolve => setTimeout(async () => resolve(
            await step.context.sendActivity("Ok. Your service request with ticket no " + inc_id + " is created.")
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
module.exports.CreateIncidentDialog = CreateIncidentDialog;
