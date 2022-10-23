const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Octokit } = require("@octokit/core");


const getPullRequests = async (after) => {
  const query = `{
    repository(name: "first-contributions", owner: "firstcontributions") {
      pullRequests(first: 100, states: OPEN ${!after ? '' : ', after: ' + '"'+after+'"'}) {
        edges {
          node {
            mergeable
            state
            number
            additions
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

const closePR = async (number) => {
  const commentResponse = await octokit.request(`POST /repos/${owner}/${repo}/pulls/${number}/reviews`, {
    owner,
    repo,
    pull_number: number,
    body: `Congratulations! You've successfully submitted a pull request. 🎉 🥳 🎊
    Unfortunately, we can't merge and have to close this pull request because of merge conflicts.
    If you really wanted to make these changes, please read [design decisions](https://github.com/firstcontributions/first-contributions/issues/35892)

  If you didn't make changes to other lines deliberately, it's possible that your IDE made the changes with a utility like prettier. Next time, make sure that you only add your changes by using 'git add -p' and rather than 'git add Contributors.md'

  Feel free to ask me any questions if you need further clarifications :)

  Cheers

  If you're interested in trying this again 🚀, please try adding your entry somewhere in the middle of Contributors.md.
  Also, please don't change other lines as it could cause merge conflicts. 👍 
    `,
    event: 'COMMENT',
  })
  await octokit.request(`PATCH /repos/${owner}/${repo}/pulls/${number}`, {
    owner,
    repo,
    pull_number: number,
    state: 'closed',
  })
}

const closePRs = async () => {
  let hasNextPage = true
  let endCursor = null
  let prs = []
  do {
    const prResponse = await getPullRequests(endCursor)
    hasNextPage = prResponse.hasNextPage
    endCursor = prResponse.endCursor
    prs = prResponse.prs
    console.table(prs)
    const conflictingPRs = prs.filter(pr => pr.mergeable === 'CONFLICTING')
    conflictingPRs.forEach(element => {
      if (closable(element)) {
        console.log(JSON.stringify(element))
        closePR(element.number)
      }
    });
    console.table(conflictingPRs)
    console.table(conflictingPRs.filter(pr => closable(pr)))
  } while (hasNextPage)

}

const closable = element => {
  return element.changedFiles === 1 
    && element.files.edges[0].node.path === 'Contributors.md'
    && ( element.additions > 10 || element.deletions > 10 )
}

closePRs()