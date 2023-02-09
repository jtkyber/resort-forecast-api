const updateScore = (req, res, db) => {
    const { username, scoreIncrement } = req.body;
    db('users').where('username', '=', username)
    .returning('*')
    .increment('score', scoreIncrement)
    .then(user => {
        res.json(user[0].score);
    })
    .catch(() => res.status(400).json('Could not increment score'))
}

const updateSearching = (req, res, db) => {
    const { username, search } = req.body;
    db('users').where('username', '=', username)
    .update({
        searchingformatch: search
    })
    .then(() => {
        res.json(true);
    })
    .catch(() => res.status(400).json('Searching failed'))
}

const findMatch = (req, res, db) => {
    const username = req.query.username;
    const socketid = req.query.socketid;
    const curTime = Date.now();
    db('users').where('searchingformatch', 't')
    .andWhere('lastonline', '>', (curTime-3000))
    .andWhere('ingame', 'f')
    .andWhereNot({
        socketid: null,
        username: username
    })
    .andWhereNot('socketid', '=', socketid)
    .select('username','socketid')
    .then(user => {
        if (!user[0].username.length) {
            res.json(null);
        } else {
            res.json(user[0]);
        }
    })
    .catch(() => res.status(400).json('Could not find match'))
}

const setInGame = (req, res, db) => {
    const { username, isInGame } = req.body;
    db('users').where('username', '=', username)
    .update({
        ingame: isInGame
    })
    .then(() => {
        res.json(true);
    })
    .catch(() => res.status(400).json('Could not update inGame status'))
}

const addGuestUser = (req, res, db) => {
    const { socketid } = req.body;
    const guestName = 'Guest' + Math.floor(Math.random() * 1000000);
    const curTime = Date.now();
    db('users')
    .insert({
        username: guestName,
        hash: 'guest',
        socketid: socketid,
        score: 0,
        friends: null,
        friendrequests: null,
        searchingformatch: true,
        lastonline: curTime,
        ingame: false
    })
    .returning('*')
    .then(user => {
        res.json(user[0]);
    })
    .catch(() => res.status(400).json('Could not add guest user'))
}

const removeGuestUser = (req, res, db) => {
    const { username } = req.body;
    db('users')
    .where('username', '=', username)
    .del()
    .then(() => {
        res.json(true);
    })
    .catch(() => res.status(400).json('Could not remove guest user'))
}

const guestCleanup = (req, res, db) => {
    const curTime = Date.now();
    db('users')
    .where('hash', '=', 'guest')
    .andWhere('lastonline', '<=', (curTime-3000))
    .del()
    .then(() => {
        res.json(true);
    })
    .catch(() => res.status(400).json('Could not remove users'))
}

const checkIfOppOnline = (req, res, db) => {
    const username = req.query.username;
    const curTime = Date.now();
    db('users').where('username', '=', username)
    .then(user => {
        if (user[0].lastonline > (curTime-3000)) {
            res.json(true);
        } else {
            res.json(false);
        }
    })
    .catch(() => res.status(400).json('Error'))
}

const checkIfOppInGame = (req, res, db) => {
    const username = req.query.username;
    const curTime = Date.now();
    db('users').where('username', '=', username)
    .then(user => {
        if ((user[0].lastonline > (curTime-3000)) && (user[0].ingame == true)) {
            res.json(true);
        } else {
            res.json(false);
        }
    })
    .catch(() => res.status(400).json('Error'))
}

module.exports = {
    updateScore,
    updateSearching,
    findMatch,
    setInGame,
    addGuestUser,
    removeGuestUser,
    guestCleanup,
    checkIfOppOnline,
    checkIfOppInGame
}
