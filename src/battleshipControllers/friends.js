const getFriends = (req, res, db) => {
    const username = req.query.username;
    db('users').where('username', '=', username)
    .then(user => {
        if (user[0].friends) {
            const friendArray = user[0].friends.split(',');
            Promise.all(friendArray.map(fName => {
                return db('users').where('username', '=', fName)
                .select('username','socketid','ingame','lastonline')
                .then(friend => {
                    return friend[0];
                })
            })).then(data => {
                res.json(data);
            })
        } else {
            res.json([]);
        }
    })
    .catch(() => res.status(400).json('Could not find friends'))
}

const findFriend = (req, res, db) => {
    const username = req.query.username;
    db('users').select('username','socketid','ingame','lastonline','friends','friendrequests')
    .where('username', '=', username)
    .then(user => {
        if (user[0].username) {
            res.json(user[0])
        } else {
            throw new Error('Could not find that friend')
        }
    })
    .catch(err => {console.log(err); res.status(400).json(err)})
}

const addFriend = (req, res, db) => {
    const { username, friendlist } = req.body;
    db('users').where('username', '=', username)
    .update({
        friends: friendlist
    })
    .then(() => {
        res.json(true);
    })
    .catch(err => res.status(400).json('Could not add friend'))
}

const updateFriendRequests = (req, res, db) => {
    const { requestlist, username } = req.body;
    db('users').where('username', '=', username)
    .update({
        friendrequests: requestlist
    })
    .then(() => {
        res.json(true);
    })
    .catch(err => res.status(400).json('Could not update friend requests'))
}

const addSelfToFriend = (req, res, db) => {
    const { friendlist, friendname } = req.body;
    db('users').where('username', '=', friendname)
    .update({
        friends: friendlist
    })
    .then(() => {
        res.json(true);
    })
    .catch(err => res.status(400).json('Could not add self to friendlist of friend'))
}

const getFriendRequests = (req, res, db) => {
    const username = req.query.username;
    db('users').where('username', '=', username)
    .then(user => {
        res.json(user[0].friendrequests)
    })
    .catch(err => res.status(400).json('Could not find friend requests'))
}

const getFriendsOnline = (req, res, db) => {
    const username = req.query.username;
    const curTime = Date.now();
    db('users').where('username', '=', username)
    .then(user => {
        if (user[0].friends) {
            const friendArray = user[0].friends.split(',');
            Promise.all(friendArray.map(fName => {
                return db('users').where('username', '=', fName)
                .then(friend => {
                    return friend[0].username;
                })
            })).then(allFriends => {
                db('users')
                .whereIn('username', allFriends)
                .andWhere('lastonline', '>', (curTime-3000))
                .select('username','socketid','ingame','lastonline')
                .then(users => {
                    res.json(users);
                })
            })
        } else {
            res.json([]);
        }
    })
    .catch(() => res.status(400).json('Could not find friends'))
}

const updateOnlineStatus = (req, res, db) => {
    const { username } = req.body;
    db('users').where('username', '=', username)
    .update({
        lastonline: Date.now()
    })
    .then(() => {
        res.json(true);
    })
    .catch(err => res.status(400).json(err))
}

module.exports = {
    getFriends,
    findFriend,
    addFriend,
    addSelfToFriend,
    updateFriendRequests,
    getFriendRequests,
    getFriendsOnline,
    updateOnlineStatus
};
