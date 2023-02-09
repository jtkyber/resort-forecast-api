const handleRegister = (req, res, db, bcrypt) => {
    const { username, password, socketid } = req.body;
    console.log(req.body)
    const hash = bcrypt.hashSync(password);
    db('users')
    .returning('*')
    .insert ({
        username: username,
        hash: hash,
        socketid: socketid
    })
    .then(user => {
        if (socketid.length > 0) {
            console.log(user)
            res.json(user[0]);
        } else {
            res.json('no socketid')
        }
    })
    .catch((err) => res.status(400).json(err, 'unable to register'))
}

module.exports = {
    handleRegister
};
