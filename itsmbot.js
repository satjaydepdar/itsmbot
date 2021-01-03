// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { CreateIncidentDialog } = require('./componentDialogs/createIncidentDialog')
const { UnlockPasswordDialog } = require('./componentDialogs/unlockPasswordDialog')
const { ResetPasswordDialog } = require('./componentDialogs/resetPasswordDialog')
const { GetTicketStatusDialog } = require('./componentDialogs/getTicketStatusDialog')
const {LuisRecognizer}  = require('botbuilder-ai');

class ITSMbot extends ActivityHandler {
	constructor(conversationState,userState) {
		super();

		this.conversationState = conversationState;
		this.userState = userState;
		this.dialogState = conversationState.createProperty("dialogState");
		this.createIncidentDialog = new CreateIncidentDialog(this.conversationState,this.userState);
		this.unlockPasswordDialog = new UnlockPasswordDialog(this.conversationState,this.userState);
		this.resetPasswordDialog = new ResetPasswordDialog(this.conversationState,this.userState);
		this.getTicketStatusDialog = new GetTicketStatusDialog(this.conversationState, this.userState);

		this.previousIntent = this.conversationState.createProperty("previousIntent");
		this.conversationData = this.conversationState.createProperty('conservationData');

		const dispatchRecognizer = new LuisRecognizer({
			applicationId: process.env.LuisAppId,
			endpointKey: process.env.LuisAPIKey,
			endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
		}, {
			includeAllIntents: true
			
		}, true);
			 
		// See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
		this.onMessage(async (context, next) => {
			const luisResult = await dispatchRecognizer.recognize(context)
			const intent = LuisRecognizer.topIntent(luisResult); 
			const entities = luisResult.entities;
			await this.dispatchToIntentAsync(context, intent, entities);
			await next();
		});

	this.onDialog(async (context, next) => {
			// Save any state changes. The load happened during the execution of the Dialog.
			await this.conversationState.saveChanges(context, false);
			await this.userState.saveChanges(context, false);
			await next();
		});   
	this.onMembersAdded(async (context, next) => {
			await this.sendWelcomeMessage(context)
			// By calling next() you ensure that the next BotHandler is run.
			await next();
		});
	}  

	async sendWelcomeMessage(turnContext) {
		const { activity } = turnContext;

		// Iterate over all new members added to the conversation.
		for (const idx in activity.membersAdded) {
			if (activity.membersAdded[idx].id !== activity.recipient.id) {
				const welcomeMessage = `Welcome to ITSM Bot ${ activity.membersAdded[idx].name }. `;
				await turnContext.sendActivity(welcomeMessage);
				await this.sendSuggestedActions(turnContext);
			}
		}
	}

	async sendSuggestedActions(turnContext) {
		var reply = MessageFactory.suggestedActions(['Create Incident', 'Reset Password', 'Unlock Password'], 'What would you like to do?');
		await turnContext.sendActivity(reply);
	}

	async dispatchToIntentAsync(context, intent, entities){

		var currentIntent = '';
		const previousIntent = await this.previousIntent.get(context,{});
		const conversationData = await this.conversationData.get(context,{});   
		if(previousIntent.intentName && conversationData.endDialog === false ){
		   currentIntent = previousIntent.intentName;
		
		}
		else if (previousIntent.intentName && conversationData.endDialog === true){
			 currentIntent = context.activity.text;           
		}
		else{
			if(intent == "Get_Status"){
				context.activity.text = "Get_Status"
			}
			currentIntent = context.activity.text;
			await this.previousIntent.set(context,{intentName: context.activity.text});
		}
		switch(currentIntent){
			case 'Create_Incident':
				console.log("Inside Create Incident Case");
				await this.conversationData.set(context,{endDialog: false});
				await this.createIncidentDialog.run(context,this.dialogState);
				conversationData.endDialog = await this.createIncidentDialog.isDialogComplete();
				if(conversationData.endDialog){
					await this.previousIntent.set(context,{intentName: null});
					await this.sendSuggestedActions(context);

				}
				break;
			case 'Unlock_Password':
				console.log("Inside Unlock Password Case");
				await this.conversationData.set(context,{endDialog: false});
				await this.unlockPasswordDialog.run(context,this.dialogState);
				conversationData.endDialog = await this.unlockPasswordDialog.isDialogComplete();
				if(conversationData.endDialog)
				{   
					await this.previousIntent.set(context,{});
					await this.sendSuggestedActions(context);
				}            
				break;

			case 'Reset Password':
				console.log("Inside Reset Password Case");
				await this.conversationData.set(context,{endDialog: false});
				await this.resetPasswordDialog.run(context,this.dialogState);
				conversationData.endDialog = await this.resetPasswordDialog.isDialogComplete();
				if(conversationData.endDialog)
				{   
					// Check if the user wants to continue. Trigger the proccess from here
					await this.previousIntent.set(context,{});
					var continueVal = await this.resetPasswordDialog.continueActions();
					if(continueVal){
						await this.previousIntent.set(context,{});
						await this.sendSuggestedActions(context);
					}
				}
				break;

			case 'Get_Status':
				console.log("Inside Get Status Case");
				await this.conversationData.set(context,{endDialog: false});
				await this.getTicketStatusDialog.run(context,this.dialogState, entities.ticket_id);
				conversationData.endDialog = await this.getTicketStatusDialog.isDialogComplete();
				if(conversationData.endDialog)
				{   
					// Check if the user wants to continue. Trigger the proccess from here
					await this.previousIntent.set(context,{});
					var continueVal = await this.getTicketStatusDialog.continueActions();
					if(continueVal){
						await this.previousIntent.set(context,{});
						await this.sendSuggestedActions(context);
					}
				}  
				break;

			default:
				console.log("Did not match any case");
				break;
		}
	}
}

module.exports.ITSMbot = ITSMbot;
