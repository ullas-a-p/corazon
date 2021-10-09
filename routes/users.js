var express = require('express');
var router = express.Router();
var covid= require('covid19-api');
var path=require('path');
var request = require('request');
var options = {
  'method': 'GET',
 'url':'https://corona.lmao.ninja/v2/countries/India?yesterday=false&strict=true&query',
 //'url': 'https://api.covid19india.org/data.json', 
 'headers': {
  }
};

const puppeteer = require ('puppeteer');     // Include puppeteer module
const fs = require ('fs');   // file system Node.js module.
const userHelpers=require('../helpers/userHelpers');
var userDetails


const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
   return next()
  }
  else{
    req.session.redirectUrl = req.url;
     res.redirect('/login')
  }
}

router.get('/',async function(req, res, next) {
  let user=req.session.user
  let data;
  request(options, function (error, response) {
    if (error) throw new Error(error);
    data=JSON.parse(response.body);
    //let len=response.body.cases_time_series.length;
    //console.log(data[len-1]);
  res.render('user/index', {user,data:data});
  });
  
});

router.get('/digitalCard/generatePdf',verifyLogin,async function (req,res,next) {
  let temp=req.query.temp
  let user=req.session.user  
  try {	
		const browser = await puppeteer.launch();   // launch puppeteer API
    const page = await browser.newPage();	

     //1. Create PDF from URL
    //profile=await userHelpers.getProfile(user._id)
    await page.goto('http://localhost:3000/digitalCard/template'+temp)//,{template:true,profile:profile})
		await page.emulateMedia ('screen');
		await page.pdf ({
		path: './public/user/digitalCards/'+user._id+'.pdf', // name of your pdf file in directory
		format: 'A5', //  specifies the format
    printBackground: true ,
    preferCSSPageSize: true,     // print background property
		});
		await console.log ('done');  // console message when conversion  is complete!
	//await browser.close();
  //	process.exit();
    //await ExampleOperations();
	} catch (e) {
		console.log ('***************Our error***************', e);
  }
  var data = await fs.readFileSync('./public/user/digitalCards/'+user._id+'.pdf');
  res.contentType("application/pdf");
  res.send(data);

} ) ;
router.get('/digitalCard/pdf',verifyLogin,async (req,res)=>{
  let userId=req.session.user._id
  var data = await fs.readFileSync('./public/user/digitalCards/'+userId+'.pdf');
  res.contentType("application/pdf");
  res.send(data);
})
router.get('/digitalCard/template',verifyLogin,async function(req, res, next) {
  let user=req.session.user
  userHelpers.getProfile(user._id).then((profile)=>{
    userDetails=profile
    console.log("ADADASDAD",userDetails);
    res.render('user/template', {user,userDetails,digitalCard:true});
  })
  })
router.get('/digitalCard/template1',async function(req, res, next) {
 // let user=req.session.user
 // userHelpers.getProfile(user._id).then((profile)=>{
        //userDetails=profile.profile
      //  profile=userDetails
      console.log(userDetails);
        res.render('user/template1', {template:true,profile:userDetails});})




router.get('/digitalCard/createProfile',verifyLogin,async function(req, res, next) {
  let user=req.session.user
  userHelpers.getProfile(user._id).then((profile)=>{
    res.render('user/profile', {user,digitalCard:true,profile:profile});
  }).catch(()=>{
    res.render('user/createProfile', {user,digitalCard:true});
  })
});
router.post('/digitalCard/createProfile',verifyLogin,async (req,res)=>{
 let userDetails=req.body
 let user=req.session.user
  userHelpers.addProfile(user._id,userDetails).then((response)=>{
    res.redirect('/digitalCard/profile')
  })
  
})
router.get('/digitalCard/profile',verifyLogin,async function(req, res, next) {
  let user=req.session.user
  userHelpers.getProfile(user._id).then((profile)=>{
    userDetails=profile
    console.log(userDetails);
    res.render('user/profile', {user,digitalCard:true,profile});
  }).catch(()=>{
    res.redirect('/digitalCard/createProfile')
  })

});
router.get('/customerRecord/record',verifyLogin,async function(req, res, next) {
   let user=req.session.user
   var Record
   userHelpers.getRecord(user._id).then((response)=>{Record=response
   console.log("RECORD:",Record);
        res.render('user/customerRecord', {customerRecord:true,user,template:false,record:Record})
   })})
    //   })
    router.get('/customerRecord/createRecord/',async function(req, res, next) {
      let userId=req.query.userId
      let user=req.session.user
     
            res.render('user/createRecord', {user,customerRecord:true,userId,template:true});})
    // })
router.post('/customerRecord/createRecord/',async function(req, res, next) {
  let userId=req.query.userId     
  //let user=req.session.user
  let url=req.url;
      let record=req.body
      userHelpers.addRecord(userId,record).then((record)=>{
             //userDetails=profile.profile
           //  profile=userDetails
          
             res.render('user/recordEntSucc', {url,customerRecord:true,template:true});})})
      
router.get('/login', function(req, res, next) {
  if(req.session.userLoggedIn){
    res.redirect('/')
  }
  else{
    res.render('account/login',{"loginErr":req.session.loginErr});
    req.session.loginErr=null;
  }
  });
 
router.get('/signup', function(req, res, next) {
    res.render('account/signup',{'signupErr':req.session.signupErr});
    req.session.signupErr=null
}); 
router.post('/signup',function(req,res,next){
userHelpers.doSignup(req.body).then((response,reject)=>{
if (response){
  req.session.userLoggedIn=true
  req.session.user=response
  res.redirect('/')
}
else {
  req.session.signupErr="Email Id already Exists";
  res.redirect('/signup')
}

})
})
router.post('/login',(req,res,next)=>{
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response)=>{
  if(response.stat){
    req.session.userLoggedIn=true
    req.session.user=response.user
    if (req.session.redirectUrl) {
      redirectUrl = req.session.redirectUrl;
      req.session.redirectUrl = null;
      res.redirect(redirectUrl)
     }
     else{
    res.redirect('/')}
  }
  else{
    req.session.loginErr="Invalid Username or Password"
    res.redirect('/login')
  }
})
})
router.get('/signout', function(req, res, next) {
  req.session.user=null
  req.session.userLoggedIn=null
  res.redirect('/');
})
  
  module.exports = router;
