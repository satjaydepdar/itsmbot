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

class CreateIncidentDialog extends ComponentDialog {

    constructor(conservsationState, userState) {
        super('createIncidentDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            // this.firstStep.bind(this),  // Ask confirmation if user wants to create incident request?
            this.getName.bind(this),    // Get name from user
            this.getIssue.bind(this),  // Issue details of an incident
            this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to create incident
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

    async firstStep(step) {
        endDialog = false;
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to create an incident?', ['yes', 'no']);

    }

    async getName(step) {
        return await step.prompt(TEXT_PROMPT, 'In what name incident is to be created?');
    }

    async getIssue(step) {
        step.values.name = step.result
        return await step.prompt(TEXT_PROMPT, 'Provide details of the issue you face?');
    }

    async confirmStep(step) {
        step.values.issue = step.result
        var msg = ` You have entered following values: \n Name: ${step.values.name}\n Issue: ${step.values.issue}`
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to create an incident?', ['yes', 'no']);
    }
    async summaryStep(step) {
        if (step.result === true) {
            var username = "meapi";
            var password = "admin@123";

            var authenticationHeader = "Basic " + new Buffer(username + ":" + password).toString("base64");

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
            for(var i - 0; i < 4; i++){
            await request.post(options, async (err, res, body) => {
                console.log(body)
                console.log(res)
                if (err) {
                    console.log(err)
                } else {
                    let response = JSON.parse(body);
                    inc_id = response.request['id'];
                }
            });}
            await new Promise(resolve => setTimeout(async () => resolve(
                await step.context.sendActivity("Incident successfully created. Your incident id is : " + inc_id)
            ), 6000));
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
module.exports.CreateIncidentDialog = CreateIncidentDialog;
