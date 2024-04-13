module.exports = function(app, db,crypto) {
  app.get('/api/session', (req,res) => {

    /*Set session for all users*/ 
    
    let options = {
      maxAge: 1000*60*720
    }
    const Cookie = crypto.randomBytes(32).toString('base64')
    res.cookie('session', Cookie, options)
    res.send({"session":Cookie})
    // res.send({"test":"tetst"})
  });

  app.post('/api/note/create', (req, res) => {

    /*Create note*/

    const note = { title: req.body.title, body: req.body.body };
    const session = req.header('Authorization');
    if (session === undefined) {
      res.send({"error": "Not auth"})
    }
    const uuid = crypto.randomUUID()
    const config = {"isAdmin":0}
    const stmt = db.prepare("INSERT INTO notes (note, uuid, createBy, config) VALUES (?, ?, ?, ?)");
    try {
      const info = stmt.run(JSON.stringify(note), uuid, session, JSON.stringify(config));
      //res.send(db.prepare("SELECT uuid FROM notes WHERE id = ?").get(info.lastInsertRowid));
      res.send({...{"error":null},...{"uuid": uuid}})
    } catch (e) {
      console.log(e)
      res.send({"error": "sqlite error"});
    }
  });

  app.get('/api/notes', (req,res)=>{

    /* Get all notes by user*/

    if (req.header('Authorization') === undefined) {
      res.send({"error":"Not auth"})
    }
    try{
      const Notes = db.prepare("SELECT * FROM notes WHERE createBy = ?").all(req.header('Authorization'))
      res.send({...{"notes":Notes},...{"error":"null"}})
    } catch(e) {
      res.send({...{"notes":[]},...{"error":"sql error"}})
    }

  });

  app.get('/api/note/:uuid', (req, res) => {

    /* Get note by uuid */

    const {uuid} = req.params
    try {
      const Note = db.prepare("SELECT * FROM notes WHERE uuid = ?").get(uuid);
      if (req.header('Authorization') === Note.createBy) {
        res.send({"id":Note.id, "note":JSON.parse(Note.note),"error":null})
      }
      res.send({"error":"You dont have permissions for this action"});
    } catch(e) {
      console.log(e)
      res.send({"error": "sqlite error1"});
    }
  });

  app.get('/api/note/:uuid/update', (req, res) => {

    /* Update note by uuid */


    /*
    By Developer: Mikhail Krukov
    Comment: I think this implementation of the update function is the most optimal 

    request example: 
          http://127.0.0.1:50000/api/note/67bdaf3f-aa8e-4d29-ba7e-e3d74689aae4/update?prop=title&value=helloworld
    */


    const {uuid} = req.params
    const {prop, value} = req.query // title or body potential

    const config = {}
    const notes = {}

    const stmt = db.prepare("SELECT * FROM notes")
    for (const noteObj of stmt.iterate()) {
      notes[noteObj.uuid] = {...JSON.parse(noteObj.note), ...{"createBy":noteObj.createBy}};
    }
    
    const Config = JSON.parse(((db.prepare("SELECT config FROM notes WHERE uuid = ?").get(uuid)) ?? {config:'{"isAdmin": 0}'}).config);
    console.log(Config)
    if (Config["isAdmin"] != 0) {
      config["isAdmin"] = true;
    }

    const updateNote = (uuid,prop,value) => {
      notes[uuid][prop] = value
    }
    
    if (prop !== undefined && value !== undefined ) {
      updateNote(uuid, prop, value)
    }

    if (!config.isAdmin){
      res.send({
        "Status":"403 forbidden",
        "Descritpion":"only admins notes can be edditable"
      });
    }
    updateNote(uuid, prop, false)
    res.send({
      "Flag":"kxctf{testflag}"
    });
  });
}