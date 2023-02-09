const postEmail = (req, res, db) => {
    const { email } = req.body;

    db('unity_email_signup')
    .where({email: email})
    .then(emails => {
        if (emails.length) {
            res.json('The email you entered is already registered');
        } else addEmail();
    })

    const addEmail = () => {
        db('unity_email_signup')
        .insert({
            email: email
        })
        .then(() => {
            res.json(true)
        })
        .catch(() => res.status(400).json('unable to post email'))
    }

}

const getEmailCount = (req, res, db) => {
    db('unity_email_signup')
    .then(data => {
        res.json(data.length)
    })
    .catch(() => res.status(400).json('Could not retrieve email count'))
}

module.exports = {
    postEmail,
    getEmailCount
};
