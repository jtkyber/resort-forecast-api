const handleLogin = (req, res, db, bcrypt) => {
    const { username, password, socketid } = req.body;
    db('users').where('username', '=', username)
    .returning('*')
    .then(user => {
        const isValid = bcrypt.compareSync(password, user[0].hash);
        if (isValid) {
            db('users').where('username', '=', username)
            .returning('*')
            .update({
                socketid: socketid
            })
            .then(data => {
                if (socketid.length > 0) {
                    res.json(data[0])
                } else {
                    res.json('no socketid')
                }
            })
            .catch(err => res.status(400).json('Unable to get user'))
        } else {
            throw new Error('Wrong credentials')
        }
    })
    .catch(err => res.status(400).json(err))
}
module.exports = {
    handleLogin
};
