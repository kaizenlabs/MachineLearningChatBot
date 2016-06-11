var builder = require('../../');
var prompts = require('./prompts');


var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=56c73d36-e6de-441f-b2c2-6ba7ea73a1bf&subscription-key=6d0966209c6e4f6b835ce34492f3e6d9&q=';
var dialog = new builder.LuisDialog(model);
var crunchBot = new builder.TextBot();
crunchBot.add('/', dialog);

crunchBot.listenStdin();

// Anser help related questions
dialog.on('Help', builder.DialogAction.send(prompts.helpMessage));

// Answer acquisition related questions
dialog.on('Acquisitions',[askCompany, answerQuestion('acquisitions', prompts.answerAcquisitions)]);

// Answer IPO date
dialog.on('IpoDate', [askCompany,answerQuestion('ipoDate',prompts.answerIpoDate)]);

// Answer headquarters related questions
dialog.on('Headquarters', [askCompany, answerQuestion('headquarters', prompts.answerHeadquarters)]);

// Answer description questions
dialog.on('Description', [askCompany,answerQuestion('description', prompts.answerDescription)]);

// Answer founder related questions

dialog.on('Founders', [askCompany, answerQuestion('founders', prompts.answerFounders)]);

/** Answer website related questions like "how can I contact microsoft?" */
dialog.on('website', [askCompany, answerQuestion('website', prompts.answerWebsite)]);

/** 
 * This function the first step in the waterfall for intent handlers. It will use the company mentioned
 * in the users question if specified and valid. Otherwise it will use the last company a user asked 
 * about. If it the company is missing it will prompt the user to pick one. 
 */

function askCompany(session,args,next){
    //Check LUIS for company
    var company;
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');
    if(entity){
        // Check for valid company from user input
         // * This calls the underlying function Prompts.choice() uses to match a users response
        //   to a list of choices. When you pass it an object it will use the field names as the
        //   list of choices to match against.
        company = builder.EntityRecognizer.findBestMatch(data, entity.entity);
    } else if (session.dialogData.company){
        // Just multi-turn over the existing company
        company = session.dialogData.company;
    }
    
    // Prompt the user to pick a company if they put an invalid one in
    if(!company){
        var txt = entity ? session.gettext(prompts.companyUnknown, {company: entity.entity}) : prompts.companyMissing;
        
        // Prompt user to pick a company from the list
        builder.Prompts.choice(session, text, data);
    } else {
        // Great! pass the company to the next step in the waterfall which will answer the question.
        // * This will match the format of the response returned from Prompts.choice().
        next({ response: company})
    }
}

/**
 * This function generates a generic answer step for an intent handlers waterfall. The company to answer
 * a question about will be passed into the step and the specified field from the data will be returned to 
 * the user using the specified answer template. 
 */

function answerQuestion(field, answerTemplate){
    return function (session, results){
        // Check to see if we have a company
        if(results.response){
            // Save company for multi-turn case and compose answer
            var company = session.dialogData.company = results.response;
            var answer = { company: company.entity, value: data[company.entity][field]};
            session.send(answerTemplate, answer);
        } else {
            session.send(prompts.cancel);
        }
    };
}

/** 
 * Sample data sourced from http://crunchbase.com on 3/18/2016 
 */
var data = {
  'Microsoft': {
      acquisitions: 170,
      ipoDate: 'Mar 13, 1986',
      headquarters: 'Redmond, WA',
      description: 'Microsoft, a software corporation, develops licensed and support products and services ranging from personal use to enterprise application.',
      founders: 'Bill Gates and Paul Allen',
      website: 'http://www.microsoft.com'
  },
  'Apple': {
      acquisitions: 72,
      ipoDate: 'Dec 19, 1980',
      headquarters: 'Cupertino, CA',
      description: 'Apple is a multinational corporation that designs, manufactures, and markets consumer electronics, personal computers, and software.',
      founders: 'Kevin Harvey, Steve Wozniak, Steve Jobs, and Ron Wayne',
      website: 'http://www.apple.com'
  },
  'Google': {
      acquisitions: 39,
      ipoDate: 'Aug 19, 2004',
      headquarters: 'Mountain View, CA',
      description: 'Google is a multinational corporation that is specialized in internet-related services and products.',
      founders: 'Baris Gultekin, Michoel Ogince, Sergey Brin, and Larry Page',
      website: 'http://www.google.com'
  },
  'Amazon': {
      acquisitions: 58,
      ipoDate: 'May 15, 1997',
      headquarters: 'Seattle, WA',
      description: 'Amazon.com is an international e-commerce website for consumers, sellers, and content creators.',
      founders: 'Sachin Agarwal and Jeff Bezos',
      website: 'http://amazon.com'
  }
};