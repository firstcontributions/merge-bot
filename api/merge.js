const request = require('request')

module.exports = (req, res) => {
  const pullRequest = req.body.pull_request
  if (shouldHandlePullRequestChange(req)) {
    const result = handlePullRequest(pullRequest)
    res.json({ message: result })
  }
  res.json({ message: "Can't handle this pull request" })
}

const handlePullRequest = (pullRequest) => {
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
  (pullRequest.additions === 1 || pullRequest.additions === 2) &&
  pullRequest.additions - pullRequest.deletions === 1  &&
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
    - Continue contributing: If you're looking for projects to contribute to, checkout our [<img src="https://avatars0.githubusercontent.com/u/65761570?s=88&u=640f39b808c75c6b86460aa907dd030bcca2f3c7&v=4" width="22" title="web app" /> webapp](https://firstcontributions.github.io).
    - Join our slack group: We have a community to help/support contributors. [<img src="https://edent.github.io/SuperTinyIcons/images/svg/slack.svg" width="22" title="Slack" /> Join slack group](https://join.slack.com/t/firstcontributors/shared_invite/enQtNjkxNzQwNzA2MTMwLTVhMWJjNjg2ODRlNWZhNjIzYjgwNDIyZWYwZjhjYTQ4OTBjMWM0MmFhZDUxNzBiYzczMGNiYzcxNjkzZDZlMDM).
    - Share on social media: You can share this content to help more people. [ <img alt="twitter" title="twitter" src="https://edent.github.io/SuperTinyIcons/images/svg/twitter.svg" width="22"> tweet](https://twitter.com/intent/tweet?text=Yay%21%20I%20just%20made%20my%20first%20open%20source%20contribution%20with%20@1stcontribution.%20You%20can%20too%20at%20https%3A//goo.gl/66Axwe%0A&hashtags=OpenSource,CodeNewbie). [<img alt="twitter" title="twitter" src="https://edent.github.io/SuperTinyIcons/images/svg/facebook.svg" width="22"> share](https://www.facebook.com/sharer/sharer.php?u=https://roshanjossey.github.io/first-contributions&quote=Yay%21%20I%20just%20made%20my%20first%20open%20source%20contribution%20with%20First%20Contributions.%20You%20can%20too,%20by%20following%20a%20simple%20tutorial%20at%20https%3A//goo.gl/66Axwe&hashtag=%23OpenSource)

We'd love to hear your thoughts about this project. Let us know how we can improve my commenting or opening an issue here.`;

const logStatusAndErrors = (error, response) => {
  console.error('error:', error) // Print the error if one occurred
  console.error('statusCode:', response && response.statusCode) // Print the response status code if a response was received
}
