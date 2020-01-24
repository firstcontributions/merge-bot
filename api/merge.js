module.exports = (req, res) => {
    const pullRequest = req.body.pull_request
    if (shouldHandlePullRequestChange(req)) {
        request(pullRequest.diff_url, (error, response, body) => {
            logStatusAndErrors(error, response)
            if (isChangeInContributorsFile(body)) {
                const options = getPostRequestOptions(pullRequest)
                request.put(options, (error, response, body) => {
                    logStatusAndErrors(error, response)
                    options.url = `${pullRequest.issue_url}/comments`
                    if (response.statusCode === 200) {
                        request.post(options, (error, response, body) => {
                            logStatusAndErrors(error, response)
                        })
                    }
                })
            }
        })
    }
    res.json({ message: 'Awesome' })
}



const shouldHandlePullRequestChange = req =>
    req.body.action === 'opened' && isSingleLineChange(req.body.pull_request)

const isChangeInContributorsFile = diff =>
    (diff.match(/Contributors\.md/g) || []).length === 4

const isSingleLineChange = pullRequest =>
    (pullRequest.additions === 1 || pullRequest.additions === 2) &&
    pullRequest.additions - pullRequest.deletions === 1 &&
    pullRequest.changed_files === 1

const getPostRequestOptions = pullRequest => ({
    url: `${pullRequest.url}/merge`,
    json: {
        body: getMergeMessage(pullRequest.user.login)
    },
    headers: {
        Authorization: process.env.GITHUB_SECRET,
        'User-Agent': 'request'
    }
})

const getMergeMessage = userName => `Hi  @${userName}, I'm quite elated about your pull request.
      I wanna evolve this project to addresses various problems faced by first-time contributors.
      I'd love to learn about your journey in open source community, the problems, pain points you had etc.
      could you explain how you felt when you went through the tutorial, made a pull request and learned that i merged it?

      We’ve recently added social share  to our web app.
      Could you please go to https://firstcontributions.github.ios/#social-share
      and share your first contribution to open source? Also, check out projects with easy issues while you’re there.`

const logStatusAndErrors = (error, response) => {
    console.log('error:', error) // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode) // Print the response status code if a response was received
}
