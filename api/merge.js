const fetch = require('node-fetch');

export default function handler(req, res) {
  const pullRequest = req.body.pull_request
  console.log(req.body.action)
  console.error(shouldHandlePullRequestChange(req))
  if (shouldHandlePullRequestChange(req)) {
    const result = handlePullRequest(pullRequest)
    res.json({ message: result })
  }
  res.json({ message: "Can't handle this pull request" })
}

const handlePullRequest = async (pullRequest) => {
  try {
    const response = await fetch(pullRequest.diff_url);
    const body = await response.text();
    logStatusAndErrors(null, response);
    if (isChangeInContributorsFile(body)) {
      return mergePullRequest(pullRequest);
    }
    return 'diff check failed';
  } catch (error) {
    logStatusAndErrors(error, null);
    return `diff check failed ${error}`;
  }
};

const mergePullRequest = async (pullRequest) => {
  try {
    const options = getPostRequestOptions(pullRequest.user.login, `${pullRequest.url}/merge`);
    const response = await fetch.put(options);
    logStatusAndErrors(null, response);
    if (response.status === 200) {
      return postComment(pullRequest);
    }
    return 'Merge failed';
  } catch (error) {
    logStatusAndErrors(error, null);
    return `Merge failed ${error}`;
  }
};

const postComment = async (pullRequest) => {
  try {
    const options = getPostRequestOptions(pullRequest.user.login, `${pullRequest.issue_url}/comments`);
    const response = await fetch.post(options);
    logStatusAndErrors(null, response);
    return response.ok ? 'Awesome' : 'Commenting failed';
  } catch (error) {
    logStatusAndErrors(error, null);
    return `Commenting failed ${error}`;
  }
};

const shouldHandlePullRequestChange = req =>
  (['opened', 'reopened', 'synchronized' ].includes(req.body.action)) && isSingleLineChange(req.body.pull_request)

const isChangeInContributorsFile = diff =>
  (diff.match(/Contributors\.md/g) || []).length === 4

const isSingleLineChange = pullRequest =>
  (pullRequest.additions === 1 || pullRequest.additions === 2) &&
  pullRequest.additions - pullRequest.deletions === 1 &&
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

  If you liked the tutorial, please star this repo by clicking star button on top right of this page.
  <img alt="star screenshot" title="star button" src="https://firstcontributions.github.io/assets/star.png">


  # Next steps
  - Continue contributing: If you're looking for projects to contribute to, checkout our [<img src="https://avatars0.githubusercontent.com/u/65761570?s=88&u=640f39b808c75c6b86460aa907dd030bcca2f3c7&v=4" width="22" title="web app" /> webapp](https://firstcontributions.github.io).
  - Join our slack group: We have a community to help/support contributors. [<img src="https://edent.github.io/SuperTinyIcons/images/svg/slack.svg" width="22" title="Slack" /> Join slack group](https://join.slack.com/t/firstcontributors/shared_invite/zt-1hg51qkgm-Xc7HxhsiPYNN3ofX2_I8FA).
  - Share on social media: You can share this content to help more people. [ <img alt="twitter" title="twitter" src="https://edent.github.io/SuperTinyIcons/images/svg/twitter.svg" width="22"> tweet](https://twitter.com/intent/tweet?text=Yay%21%20I%20just%20made%20my%20first%20open%20source%20contribution%20with%20@1stcontribution.%20You%20can%20too%20at%20https%3A//goo.gl/66Axwe%0A&hashtags=OpenSource,CodeNewbie). [<img alt="twitter" title="twitter" src="https://edent.github.io/SuperTinyIcons/images/svg/facebook.svg" width="22"> share](https://www.facebook.com/sharer/sharer.php?u=https://roshanjossey.github.io/first-contributions&quote=Yay%21%20I%20just%20made%20my%20first%20open%20source%20contribution%20with%20First%20Contributions.%20You%20can%20too,%20by%20following%20a%20simple%20tutorial%20at%20https%3A//goo.gl/66Axwe&hashtag=%23OpenSource)

We'd love to hear your thoughts about this project. Let us know how we can improve by commenting or opening an issue here.

![celebration gif](${getRandomGif()})`;

const celebrationGifs = [
  'https://c.tenor.com/ZCq4SwgCfxAAAAAC/snoopy-peanuts.gif',
  'https://c.tenor.com/Z0ojZS2kpO0AAAAC/milk-and-mocha-happy.gif',
  'https://c.tenor.com/LffD4a8ET9AAAAAC/heart-celebrate.gif',
  'https://c.tenor.com/HJ0iSKwIG28AAAAC/yes-baby.gif',
  'https://c.tenor.com/4blWuIh5MIYAAAAC/baby-yoda.gif',
  'https://c.tenor.com/B_zYdea4l-4AAAAC/yay-minions.gif',
  'https://media1.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  'https://media2.giphy.com/media/IwAZ6dvvvaTtdI8SD5/giphy.gif',
  'https://media0.giphy.com/media/z8gtBVdZVrH20/giphy.gif',
  'https://media2.giphy.com/media/26gN16cJ6gy4LzZSw/giphy.gif',
  'https://media1.giphy.com/media/LZElUsjl1Bu6c/giphy.gif',
  'https://media1.giphy.com/media/gHnwTttExPf4nwOWm7/giphy.gif',
]

const getRandomGif = () => celebrationGifs[Math.floor(Math.random() * celebrationGifs.length)]


const logStatusAndErrors = (error, response) => {
  console.error('error:', error) // Print the error if one occurred
  console.error('statusCode:', response && response.statusCode) // Print the response status code if a response was received
}


