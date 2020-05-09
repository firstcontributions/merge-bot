const request = require('request')

exports.handleSubmit = (req, res) => {
  const pullRequest = req.body.pull_request
  if (shouldHandlePullRequestChange(req)) {
    const result = handlePuRequest(pullRequest)
    res.json({ message: result })
  }
  res.json({ message: "Can't handle this pull request" })
}

const handlePuRequest = (pullRequest) => {
  request(pullRequest.diff_url, (error, response, body) => {
    logStatusAndErrors(error, response)
    if (isChangeInContributorsFile(body)) {
      return mergePullRequest(pullRequest)
    }

    return `diff check failed ${error}`
  })
}

const mergePullRequest = (pullRequest) => {
  const options = getPostRequestOptions(pullRequest.user.login, `${pullRequest.url}/merge`)
  request.put(options, (error, response, body) => {
    logStatusAndErrors(error, response)
    if (response.statusCode === 200) {
      return postComment(pullRequest)
    }
    return `Merge failed ${error}`
  })
}

const postComment = (pullRequest) => {
  const options = getPostRequestOptions(pullRequest.user.login, `${pullRequest.issue_url}/comments`)
  request.post(options, (error, response, body) => {
    logStatusAndErrors(error, response)
    return !error ? 'Awesome': `Commenting failed ${error}`
  })
}

const shouldHandlePullRequestChange = req =>
  req.body.action === 'opened' && isSingleLineChange(req.body.pull_request)

const isChangeInContributorsFile = diff =>
  (diff.match(/Contributors\.md/g) || []).length === 4

const isSingleLineChange = pullRequest =>
  (pullRequest.additions === 1 || pullRequest.additions === 2 &&
  pullRequest.additions - pullRequest.deletions === 1 ) &&
  pullRequest.changed_files === 1

const getPostRequestOptions = (user, url) => ({
  url: url,
  json: {
    body: getMergeMessage(user)
  },
  headers: {
    'Authorization': `token ${process.env.GITHUB_SECRET}`,
    'User-Agent': 'request'
  }
})

const getMergeMessage = username => `Hello @${username}, congratulations! You've successfully submitted a pull request. 🎉
    **Next steps**
    - Continue contributing: If you're looking for projects to contribute to, checkout our [webapp](https://firstcontributions.github.io).
    - Join our slack group: We have a community to help/support contributors. [Join slack group](https://join.slack.com/t/firstcontributors/shared_invite/enQtNjkxNzQwNzA2MTMwLTVhMWJjNjg2ODRlNWZhNjIzYjgwNDIyZWYwZjhjYTQ4OTBjMWM0MmFhZDUxNzBiYzczMGNiYzcxNjkzZDZlMDM).
    - Share on social media: You can share this content to help more people. [Share](https://firstcontributions.github.io/#social-share).

We'd love to hear your thoughts about this project. Let us know how we can improve my commenting or opening an issue here.`;

const logStatusAndErrors = (error, response) => {
  console.error('error:', error) // Print the error if one occurred
  console.error('statusCode:', response && response.statusCode) // Print the response status code if a response was received
}

