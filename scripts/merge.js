const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Octokit } = require("@octokit/core");
const shell = require('shelljs')

const getPullRequests = async (after) => {
  const query = `{
    repository(name: "first-contributions", owner: "firstcontributions") {
      pullRequests(first: 100, states: OPEN ${!after ? '' : ', after: ' + '"'+after+'"'}) {
        edges {
          node {
            author {
              login
            }
            mergeable
            state
            number
            additions
            headRefName
            deletions
            changedFiles
            files (first: 1) {
              edges {
                node {
                  path
                }
              }
            }
          }
        }
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
  `

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
    }),
  });
  const data =  await response.json();
  console.log(data)
  const { pullRequests } = data.data.repository
  const {endCursor, hasNextPage} = pullRequests.pageInfo
  return {prs: pullRequests.edges.map((edge) => edge.node), endCursor, hasNextPage}
}

const octokit = new Octokit({
  auth: ''
})

const owner = 'firstcontributions'
const repo = 'first-contributions'

const mergeWithBothChanges = async (headRefName, username) => {
  shell.exec(`git checkout -b ${username}-${headRefName} main`)
  shell.exec(`git pull git@github.com:${username}/first-contributions.git ${headRefName}  -X ours --no-edit`)
  shell.exec(`git checkout main`)
  shell.exec(`git merge --no-ff ${username}-${headRefName} --no-edit`)
  shell.exec(`git push origin main`)
}

const resolveConflictAndMerge = async (number, username) => {
  const commentResponse = await octokit.request(`POST /repos/${owner}/${repo}/pulls/${number}/reviews`, {
    owner,
    repo,
    pull_number: number,
    body: `
  Hello @${username}, congratulations! You've successfully submitted a pull request. 🎉

  If you liked the tutorial, please star this repo by clicking star button on top right of this page.
  <img alt="star screenshot" title="star button" src="https://firstcontributions.github.io/assets/star.png">


  # Next steps
  - Continue contributing: If you're looking for projects to contribute to, checkout our [<img src="https://avatars0.githubusercontent.com/u/65761570?s=88&u=640f39b808c75c6b86460aa907dd030bcca2f3c7&v=4" width="22" title="web app" /> webapp](https://firstcontributions.github.io).
  - Join our slack group: We have a community to help/support contributors. [<img src="https://edent.github.io/SuperTinyIcons/images/svg/slack.svg" width="22" title="Slack" /> Join slack group](https://join.slack.com/t/firstcontributors/shared_invite/zt-vchl8cde-S0KstI_jyCcGEEj7rSTQiA).
  - Share on social media: You can share this content to help more people. [ <img alt="twitter" title="twitter" src="https://edent.github.io/SuperTinyIcons/images/svg/twitter.svg" width="22"> tweet](https://twitter.com/intent/tweet?text=Yay%21%20I%20just%20made%20my%20first%20open%20source%20contribution%20with%20@1stcontribution.%20You%20can%20too%20at%20https%3A//goo.gl/66Axwe%0A&hashtags=OpenSource,CodeNewbie). [<img alt="twitter" title="twitter" src="https://edent.github.io/SuperTinyIcons/images/svg/facebook.svg" width="22"> share](https://www.facebook.com/sharer/sharer.php?u=https://roshanjossey.github.io/first-contributions&quote=Yay%21%20I%20just%20made%20my%20first%20open%20source%20contribution%20with%20First%20Contributions.%20You%20can%20too,%20by%20following%20a%20simple%20tutorial%20at%20https%3A//goo.gl/66Axwe&hashtag=%23OpenSource)

We'd love to hear your thoughts about this project. Let us know how we can improve by commenting or opening an issue here.

![celebration gif](https://media2.giphy.com/media/26gN16cJ6gy4LzZSw/giphy.gif)
  
  `,
    event: 'COMMENT',
  })
}

const resolveConflictsAndMergePRs = async () => {
  let hasNextPage = true
  let endCursor = null
  let prs = []
  do {
    const prResponse = await getPullRequests(endCursor)
    hasNextPage = prResponse.hasNextPage
    endCursor = prResponse.endCursor
    prs = prResponse.prs
    console.table(prs)
    const conflictingPRs = prs.filter(pr => pr.mergeable === 'CONFLICTING' && mergable(pr))
    conflictingPRs.forEach(pr => {
      mergeWithBothChanges(pr.headRefName, pr.author.login)
      resolveConflictAndMerge(pr.number, pr.author.login)
    });
    console.table(conflictingPRs)
  } while (hasNextPage)
  // } while (false)
}


const mergable = element => {
  return element.changedFiles === 1
    && element.files.edges[0].node.path === 'Contributors.md'
    && element.additions < 6
    && element.deletions < 5
}

resolveConflictsAndMergePRs()