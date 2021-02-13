let express = require('express');
let app = express();
const path = require('path');
let timestamp = require('time-stamp');
let nodemailer = require('nodemailer'); //to send emails
let session = require('express-session'); //to create sessions
let mysql = require('mysql');//for mysql database
let qrcode=require('qrcode');//for qrcode generation 
//below 3 lines comes automatically with node mailer
const { info } = require('console');
const SMTPTransport = require('nodemailer/lib/smtp-transport');
const { Session } = require('inspector');

app.use(express.static('public')); //to read static files from public folder
app.use(express.urlencoded({ extended: true })); //to parse the body of the form a webpage
app.set('view engine', 'ejs'); //to directly render the ejs files from the views folder
app.set('views', path.join(__dirname, 'views')); //if we come out of the main folder its not possible to execute it smoothly so to make it smooth we use this

//the below code is to create a session with age 2 hrs
app.use(session({
    name: 'sid',
    resave: false,
    saveUninitialized: false,
    secret: 'ssh its quiet,sceret',
    cookie: {
        maxAge: 2000 * 60 * 60,
        sameSite: true,
        secure: false
    }
}));
//creating mysql connection
const connection = mysql.createConnection({
    //for mysql8.0 we have to use this in command line ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'MyNewPass';  
    host: 'localhost',
    user: 'root',
    password: 'Sumukh@2000',
    database: 'banking',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});

let dashbord = (req, res, next) => {
    if (req.session.user) {
        res.redirect(`/`);
    }
    else {
        next();
    }
}

let doesntexist = (req, res, next) => {
    if (!req.session.user) {
        res.redirect(`/`);
    }
    else {
        next();
    }
}


//to get homepage(1)
app.get('/', (req, res) => {
    let custobj = req.session.user;
    res.render('home', { custobj });
})

//to get privacy policy page(2)
app.get('/privacypolicy', (req, res) => {
    let custobj = req.session.user;
    res.render('privacypolicy', { custobj })
})

//for customer signin page(3)
app.get('/signin/customer', dashbord, (req, res) => {
    let err = req.query.er;
    res.render('customer', { err });


})

//for about Us page(4)
app.get('/aboutus', (req, res) => {
    let custobj = req.session.user;
    res.render('aboutus', { custobj })
})

//for business page(8)
app.get('/business',(req,res)=>{

     res.render('business');
})

//for the customer dashbord page(5)
app.get('/:name', doesntexist, (req, res) => {
    let custobj = req.session.user;
    res.render('dashbord', { custobj });
})

//for payments and payments detaile(6)
app.get('/:name/payments', doesntexist, (req, res) => {
    let custobj = req.session.user;
    let x = req.query.acc;
    let y = req.query.bal;
    let z = req.query.transaction;
    connection.query('select * from transactions where sendingto=? union select * from transactions where sendingfrom=?',[custobj.cust_id,custobj.cust_id],(err,rows)=>{
         if (err) {
            throw err;
        }
        let tr=rows;
        res.render('payment', { custobj, x, y, z, tr})
    })
    
})

//feedback 7
app.get('/customer/feedback',(req,res)=>{
    let custobj = req.session.user;
    let a=req.query.resp;
    res.render('feedback.ejs',{custobj,a});
})

//avail loan(9)
app.get('/:name/availloan',async (req,res)=>{
    
    let custobj = req.session.user;
    res.render('loan',{custobj});
})

//loan form post from page 9
app.post('/availloan',(req,res)=>{
      let custobj = req.session.user;
      if(req.body.salary!=''){
          connection.query('insert into loan_application(cust_id,loan_type,applied_date,principal,salary) values(?,?,?,?,?)',[custobj.cust_id,req.body.loantype,timestamp(),parseInt(req.body.principal),parseInt(req.body.salary)],(err,res)=>{
          if(err) throw err;
          console.log('Last insert ID:', res.insertId);

      })
      } else{
      connection.query('insert into loan_application(cust_id,loan_type,applied_date,principal) values(?,?,?,?)',[custobj.cust_id,req.body.loantype,timestamp(),parseInt(req.body.principal)],(err,res)=>{
          if(err) throw err;
          console.log('Last insert ID:', res.insertId);

      })
      }
      res.redirect(`/${custobj.fname + custobj.lname}`);
})



//customer forgot password
app.post('/customer/forgotpassword',(req,res)=>{
      connection.query('select * from customer where cust_id=? and email=?',[parseInt(req.body.accno),req.body.email],(err,rows)=>{
          if(err) throw err;
          if(!rows){
              res.redirect('/');
          }else{
         connection.query('select * from customer_login where cust_id=?',[rows[0].cust_id],(err,row)=>{
            if(err) throw err;
             let transporter = nodemailer.createTransport({
            service: 'gmail',
               auth: {
               user: 'srisuchanya@gmail.com',
               pass: 'SriSuChaNya@456987'
              }
          });
       let mailoptions = {
        from: 'srisuchanya@gmail.com',
        to: req.body.email,
        subject: 'sending passcode',
        text: row[0].passcode
       };
       transporter.sendMail(mailoptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
       });
         });     
       res.redirect('/signin/customer');
    }
   });
})


//customer feedback post
app.post('/customer/feedback',(req,res)=>{
    let custobj = req.session.user;
    connection.query('insert into feedback(cust_id,custexp,complaint) values (?,?,?)',[custobj.cust_id,req.body.feedback,req.body.complaint],(err,res)=>{
        if(err) throw err;
        console.log('Last insert ID:', res.insertId);
    })
    res.redirect('/customer/feedback?resp=submitted')
})

//payment post route
app.post('/payments', (req, res) => {
    let custobj = req.session.user;
    //selecting the recipient tuple in customer table
    connection.query('select * from customer where cust_id = ?', [parseInt(req.body.recipient)], (err, rows) => {
        if (err) {
            throw err;
        }
        //if recipient doesnt exist redirect to same page showing error
        if (!rows[0]) {
            res.redirect(`/${custobj.fname + custobj.lname}/payments?acc=doesntexist`);
        }
        //proceed if the tuple of recipient exists
        else {
            //checking for sufficient balance
            if ((custobj.balance - parseInt(req.body.amount)) >= 500) {
                custobj.balance -= parseInt(req.body.amount); //updating payers balance after deduction
                //inserting the transaction
                connection.query('insert into transactions(sendingfrom,sendingto,transaction_date,amount) values(? ,? , ?, ?)', [custobj.cust_id, parseInt(req.body.recipient), timestamp(), req.body.amount], (err, res) => {
                    if (err) throw err;

                    console.log('Last insert ID:', res.insertId);
                });
                //updating the payers tuple in customer table
                connection.query('update customer set balance=? where cust_id=?', [custobj.balance, custobj.cust_id], (err, res) => {
                    if (err) throw err;

                    console.log('Last insert ID:', res.insertId);
                });
                //updating the recipient tuple
                connection.query('update customer set balance=? where cust_id=?', [rows[0].balance + parseInt(req.body.amount), rows[0].cust_id], (err, res) => {
                    if (err) throw err;

                    console.log('Last insert ID:', res.insertId);
                });
                res.redirect(`/${custobj.fname + custobj.lname}/payments?transaction=success`);
            }
            else { //if balance is insufficient redirect to same page
                res.redirect(`/${custobj.fname + custobj.lname}/payments?bal=insufficient`);
            }

        }
    });
})

//for signin page to post details for new customer(Registration) (from page 3 to mysql)
app.post('/signin/register', async (req, res) => {
    let a = req.body;
    let regarr = [];
    let pw;
    //iterating through register object and pushing the values to regarr array
    for (let i in a) {
        //if savings account set to 1 ,for current acc set to 2(due to data constraint in mysql)
        if (a[i] === 'savings') {
            a[i] = 1;
        } else if (a[i] === 'current') {
            a[i] = 2;
        }
        //to skip the password being pushed to regarr array
        if (i != 'password' && i != 'confirm') {
            regarr.push(a[i]);
        } else {
            pw = a[i];
        }

    }
    //converting string values of balance and contact number to int
    regarr[3] = parseInt(regarr[3]);
    regarr[8] = parseInt(regarr[8]);
    //string for inserting
    let tem = `INSERT INTO customer
            (
                fname,dob,acc_type,contact_no,address,lname,gender,email,balance
            )
            VALUES
            (
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`;
    //inserting registration values into customer table
    connection.query(tem, regarr, (err, res) => {
        if (err) throw err;

        console.log('Last insert ID:', res.insertId);
    });
    //inserting login details corresponging to customer in customer_login table
    connection.query('select cust_id from customer where email=?', [a.email], (err, rows) => {
        if (err) throw err;
        connection.query('insert into customer_login (cust_id,email,passcode) values (?, ?, ?)', [rows[0].cust_id, a.email, pw], (err, res) => {
            if (err) throw err;

            console.log('Last insert ID:', res.insertId);
        });
    })

    /*let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'srisuchanya@gmail.com',
            pass: 'SriSuChaNya@456987'
        }
    });
    let mailoptions = {
        from: 'srisuchanya@gmail.com',
        to: 'sinchanar948@gmail.com',
        subject: 'Sending email using node',
        text: 'you will recieve confirmatiom email shortly!'
    };
    transporter.sendMail(mailoptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });*/
    res.redirect('/');
})


//signin authentication checker and rendering the home page if successful (from page 3 to check for authentication)
app.get('/signin/body', async (req, res) => {
    let user;
    let logindet;
    //selecting the customer id from customer_login table whose email and password matches
    await connection.query('select cust_id from customer_login where email=? and passcode=?', [req.query.email, req.query.password], (err, rows) => {
        if (err) {
            throw err;
        }
        console.log('Data received from Db:');
        logindet = rows[0];//picking the 1st row object
        //if customer id doesn't exists redirect to the same page
        if (!logindet) {
            res.redirect('/signin/customer?er=' + 'unsuccessful');//redirecting back to signin on unsuccessful attempt
        } else {
            //select the entire customer tuple and redirect to home page
            connection.query('select * from customer where cust_id = ?', [logindet.cust_id], (err, rows) => {
                if (err) {
                    throw err;
                }
                console.log('Data received from Db:');
                user = rows[0]; //picking the 1st row object of customer tuple
                req.session.user = user; //inserting customer tuple(in user) to session object user
                res.redirect('/'); //redirecting to home page after successful login
            });
        }
    });

    //let userexists = users.find(user => user.email === req.query.email && user.password === req.query.password);


})

//logout post
app.post('/logout/customer', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.redirect('/');
        }
        else {
            res.clearCookie('sid');
            res.redirect('/');
        }
    })
})


//to allot a port to the website, appears on the commandline console 
app.listen(5000, () => {
    console.log('listening on 5000');
})