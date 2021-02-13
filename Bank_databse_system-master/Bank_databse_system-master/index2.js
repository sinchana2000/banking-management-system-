let express = require('express');
let app = express();
const path = require('path');
let timestamp = require('time-stamp');
let nodemailer = require('nodemailer'); //to send emails
let session = require('express-session'); //to create sessions
let mysql = require('mysql');//for mysql database
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
let emp_dashboard = (req, res, next) => {
    if (req.session.user2) {
        res.redirect(`/`);
    }
    else {
        next();
    }
}
let doesntexist = (req, res, next) => {
    if (!req.session.user && !req.session.user2) {
        res.redirect(`/`);
    }
    else {
        next();
    }
}
let doesntexist2 = (req, res, next) => {
    if (!req.session.user2 && !req.session.user) {
        res.redirect(`/`);
    }
    else {
        next();
    }
 } 

//to get homepage(1)
app.get('/', (req, res) => {
    let custobj = req.session.user;
    let empobj = req.session.user2;
    res.render('home', { custobj,empobj });
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

//for employee signin page
app.get('/signin/employee', emp_dashboard, (req, res) => {
    let err = req.query.er;
    res.render('employee', { err });


})

//for about Us page(4)
app.get('/aboutus', (req, res) => {
    let custobj = req.session.user;
    res.render('aboutus', { custobj })
})

//for business page(8)
app.get('/business',(req,res)=>{

     res.render('business');
});

//for the customer details page
app.get('/customer_details', doesntexist, (req, res) => {
    let empobj=req.session.user2;
    let cust1=req.query.cst;
    let x=req.query.cst;
    let cust2=req.query.cst2;
    res.render('customer_details',{empobj,cust1,cust2,x});
})

//for the employee dashboard page
app.get('/:id', doesntexist2, (req, res) => {
    let empobj = req.session.user2;
    connection.query('select count(*) as num from new_customer',(err,rows)=>{
        if(err) throw err;
        let a=rows[0].num;
        connection.query('select count(*) as no from loan_application where approval_status=?',['pending'],(err,rows)=>{
            if(err) throw err;
            let b=rows[0].no;
            res.render('emp_dashboard', { empobj,a,b});

        })
    })
    
});

//for the customer dashbord page(5)
app.get('/:name/dashbord', doesntexist, (req, res) => {
    let custobj = req.session.user;
    
   res.render('dashbord', { custobj } );
});




//for payments and payments detaile(6)
app.get('/:name/payments', doesntexist, (req, res) => {
    let custobj = req.session.user;
    let x = req.query.acc;
    let y = req.query.bal;
    let z = req.query.transaction;
    connection.query('select * from transactions where sendingto=? union select * from transactions where sendingfrom=? order by transaction_id desc',[custobj.cust_id,custobj.cust_id],(err,rows)=>{
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
app.get('/:name/availloan',(req,res)=>{
    let custobj = req.session.user;
    
    res.render('loan',{custobj});
})

//loan approval and account approval page employee page10
app.get('/employee/approvalpage',(req,res)=>{
    let empobj=req.session.user2;
    
    connection.query('select * from customer where cust_id in (select cust_id from new_customer)',(err,rows)=>{
        if(err) throw err;
        let nc=rows;
        
        connection.query('select * from loan_application where approval_status=?',['pending'],(err,rows)=>{
          if(err) throw err;
          let loan=rows;
          res.render('loanandlog',{empobj,nc,loan});
        })
        
    });
    
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
      res.redirect(`/${custobj.fname + custobj.lname}/dashbord`);
})

//approval or disapproval of account post(10)
app.post('/customer/appdisacc',(req,res)=>{
    if(req.body.right){
        let empobj=req.session.user2;
        connection.query('update customer set empid=? where cust_id=?',[empobj.empid,parseInt(req.body.right.slice(1))], (err, result) => {
           if (err) throw err;

           console.log(`Changed ${result.changedRows} row(s)`);
           connection.query('delete from new_customer where cust_id=?',[parseInt(req.body.right.slice(1))],(err, result) => {
           if (err) throw err;

           console.log(`Changed ${result.changedRows} row(s)`);
          });
        });
    }else{
        let a=`delete c,n
               from customer c
               join new_customer n
               on c.cust_id=n.cust_id
               where n.cust_id=?`;
        connection.query(a,[parseInt(req.body.wrong.slice(1))],(err, result) => {
           if (err) throw err;

           console.log(`Changed ${result.changedRows} row(s)`);
          });
    }
    res.redirect('/employee/approvalpage');
})

//Approval or disapproval of loan page10
app.post('/customer/appdisloan',(req,res)=>{
    let empobj=req.session.user2;
    if(req.body.right){
        let a=JSON.parse(req.body.right);
        console.log(a);
       connection.query('update loan_application set approval_status=?,emp_id=?,sanction_date=? where app_id=?',['Approved',empobj.empid,timestamp(),a.app_id],(err,result)=>{
           if(err) throw err;
       });
       
       let d=new Date();
       d.setFullYear(d.getFullYear()+10);
       connection.query('insert into paid_loan values(?,?,?,?,?,?,?,?)',[a.app_id,a.cust_id,a.loan_type,a.principal,0,a.principal,null,d],(err,res)=>{
           if(err) throw err;
       });

    }else{
       connection.query('update loan_application set approval_status=? where app_id=?',['Rejected',parseInt(req.body.wrong.slice(1))],(err,result)=>{
           if(err) throw err;
       })
    }
    res.redirect('/employee/approvalpage');
})




//customer forgot password
app.post('/customer/forgotpassword',(req,res)=>{
      connection.query('select * from customer where cust_id=? and email=?',[parseInt(req.body.cust_id),req.body.email],(err,rows)=>{
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

//employee forgot password
app.post('/employee/forgotpassword',(req,res)=>{
    connection.query('select * from employee where empid=? and email=?',[parseInt(req.body.empid),req.body.email],(err,rows)=>{
        if(err) throw err;
        if(!rows){
            res.redirect('/');
        }else{
       connection.query('select * from employee_login where empid=?',[rows[0].empid],(err,row)=>{
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
     res.redirect('/signin/employee');
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

//customer details post route
app.post('/customer_details', (req, res) => {
    let empobj = req.session.user2;
    //selecting the recipient tuple in customer table
    connection.query('select * from customer where cust_id = ?', [parseInt(req.body.recipient)], (err, rows) => {
       if (err) {
            throw err;
       }
       if (!rows[0]) {
        res.redirect(`/customer_details?acc=doesntexist`);
    }
    else
    {
        res.redirect(`/customer_details?cst=`);
    }
    });
})

//customer details post route
app.post('/customer_details2', (req, res) => {
    //selecting the recipient tuple in customer table
    connection.query('select * from customer', (err, rows) => {
       if (err) {
            throw err;
       }
       if (!rows[0]) {
        res.redirect(`/customer_details?acc=doesntexist`);
    }
    else
    {
        res.redirect(`/customer_details?cst2=${}`);
    }
    });
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
        
        if (err) throw err;
        connection.query('insert into customer_login (cust_id,email,passcode) values (?, ?, ?)', [rows[0].cust_id, a.email, pw], (err, res) => {
            if (err) throw err;

            console.log('Last insert ID:', res.insertId);
        });
    
    })

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
})
app.get('/signin/body2', async (req, res) => {
    let user2;
    let logindet2;
   //selecting the employee id from employee_login table whose email and password matches
   await connection.query('select empid from employee_login where email=? and passcode=?', [req.query.email, req.query.password], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log('Data received from Db:');
    logindet2 = rows[0];//picking the 1st row object
    //if employee id doesn't exists redirect to the same page
    if (!logindet2) {
        res.redirect('/signin/employee?er=' + 'unsuccessful');//redirecting back to signin on unsuccessful attempt
    } else {
        //select the entire employee tuple and redirect to home page
        connection.query('select * from employee where empid = ?', [logindet2.empid], (err, rows) => {
            if (err) {
                throw err;
            }
            console.log('Data received from Db:');
            user2 = rows[0]; //picking the 1st row object of employee tuple
            req.session.user2 = user2; //inserting employee tuple(in user) to session object user
            res.redirect(`/${user2.empid}`); //redirecting to employee dashbord page after successful login
        });
    }
});
})

    //let userexists = users.find(user => user.email === req.query.email && user.password === req.query.password);





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

app.post('/logout/employee', (req, res) => {
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