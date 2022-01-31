const  express =require('express')
const bodyParser=require('body-parser')
const Sequelize=require('sequelize');
const cors=require('cors');
const { appendFile } = require('fs');
const { Op } = require("sequelize");
let countPagination=0
let limit=2

const sequelize=new Sequelize({
    dialect: 'sqlite',
    storage: './sqlite/sample.db',
    define:{
        timestamps:false
    }
})




const JobPosting=sequelize.define('jobposting', {

    id: {
    type: Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoincrement: true
  },
  description:{
      type:Sequelize.DataTypes.STRING,
      validate: {
        len: [3, 100]
      }
  },
  deadline:{
      type:Sequelize.DataTypes.DATE,
      validate: {
       isDate:true
      }
  }
})

const Candidate=sequelize.define('candidate', {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoincrement: true
      },
      name:{
          type: Sequelize.DataTypes.STRING,
          validate: {
              len: [5,100]
          }
      },
      cv:{
        type: Sequelize.DataTypes.TEXT,
        validate: {
            len: [10,100]
        }
      },
      email:{
        type: Sequelize.DataTypes.STRING,
        validate: {
            isEmail: true
        }

      }
      
})


 JobPosting.hasMany(Candidate)


 
const app=express()
app.use(cors())
app.use(bodyParser.json());


//----------tables creation -----------------
app.get('/sync', async(req, res)=>{
    try{
        await sequelize.sync({force:true})

        res.status(201).json({message:'Tables created'})
    }
    catch(err){
        console.warn(err);
        res.status(500).json({message: 'some error'})
    }
})

//-------------- JOBPOSTING ------------------
//filtrare pe descriptions care incep cu litera A
app.get("/jobpostingsA", async (req, res) => {
    try {
      const jobs = await JobPosting.findAll({
        where: { description: {[Op.like]: '%A'},
     }
      });
  
      res.status(200).json(jobs);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });

//filtrare deadline: afisae deadline-uri expirate sau din ziua curenta
app.get("/jobpostingsDeadline", async (req, res) => {
    try {
      const jobs = await JobPosting.findAll({
        //  where: { deadline:  {[Op.lt]: '31.12.2022'} }
        where:{deadline: {[Op.lt]: new Date(), 
            [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000)}}
      
      
      });
  
      res.status(200).json(jobs);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });


app.get('/jobpostings', async(req, res)=>{
    try{
       const jobs=await JobPosting.findAll({
       })
       console.log(jobs)
       res.status(200).json(jobs)
    }
    catch(err){
        console.warn(err);
        res.status(500).json({message: 'some error'})
    }
})

//sort pe description alfabetic
app.get("/jobpostingsSort", async (req, res) => {
    try {
      const jobs = await JobPosting.findAll({});
      const jobsSorted = jobs.sort((e, i) => e.description.localeCompare(i.description));
      console.log(jobsSorted);
      res.status(200).json(jobsSorted);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });

  //PAGING FIRST ENTITY
  app.get("/jobsPaging", async (req, res) => {
    try {
      JobPosting.findAndCountAll({
        
  
        limit: limit,
        offset: countPagination,
      }).then(function (result) {
        res.status(202).json(result.rows);
        countPagination += limit;
      });
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });

app.post('/jobpostings', async(req, res)=>{
    try{
      await JobPosting.create(req.body)
      res.status(201).json({message:'created'})
    }
    catch(err){
        console.warn(err);
        res.status(500).json({message: 'some error'})
    }
})

app.get('/jobpostings/:id', async(req, res)=>{
    try{
    const job=await JobPosting.findByPk(req.params.id)
    if(job){
        res.status(200).json(job)
    }
    else{
        res.status(404).json({message:'not found'})
    }

 }
 catch(err){
     console.warn(err);
     res.status(500).json({message: 'some error'})
 }
}) 

app.put('/jobpostings/:id', async(req, res)=>{ 
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){
            await job.update(req.body, {fields:[ 'description','deadline']})
            res.status(202).json({message:'accepted'})
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})
app.delete('/jobpostings/:id', async(req, res)=>{
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){
            await job.destroy()
            res.status(202).json({message:'deleted'})
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})


//---------------------- CANDIDATE -------------------------


app.get('/jobpostings/:id/candidates', async(req, res)=>{
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){
            const candidates=await job.getCandidates()

            res.status(200).json(candidates)
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})

app.post('/jobpostings/:id/candidates', async(req, res)=>{
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){

            const candidate=req.body
            candidate.jobpostingId=job.id
            await Candidate.create(candidate)

            res.status(201).json({message:'candidate created'})
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})

app.get('/jobpostings/:id/candidates/:cid', async(req, res)=>{
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){
            const candidates=await job.getCandidates({where:{id:req.params.cid}})
            const candidate=candidates.shift();
            if(candidate){
                res.status(200).json(candidate)
            }
            else{
                res.status(404).json({message:' candidate not found'})
            }

            res.status(200).json(candidates)
        }
        else{
            res.status(404).json({message:' job not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})
app.put('/jobpostings/:id/candidates/:cid', async(req, res)=>{
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){
            const candidates=await job.getCandidates({where:{id:req.params.cid}})
            const candidate=candidates.shift();
            if(candidate){
                await candidate.update(req.body)
                res.status(202).json({message:'accepted'})
            }
            else{
                res.status(404).json({message:' candidate not found'})
            }

            res.status(200).json(candidates)
        }
        else{
            res.status(404).json({message:' job not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})
app.delete('/jobpostings/:id/candidates/:cid', async(req, res)=>{
    try{
        const job=await JobPosting.findByPk(req.params.id)
        if(job){
            const candidates=await job.getCandidates({where:{id:req.params.cid}})
            const candidate=candidates.shift();
            if(candidate){
                await candidate.destroy()
                res.status(202).json({message:'accepted'})
            }
            else{
                res.status(404).json({message:' candidate not found'})
            }

            res.status(200).json(candidates)
        }
        else{
            res.status(404).json({message:' job not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})


app.listen(8080)