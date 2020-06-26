// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const {request} = require('gaxios');
const args = process.argv.slice(2);
const requiredJobs = JSON.parse(args[0]);
const runId = process.env.GITHUB_RUN_ID;
const repo = process.env.GITHUB_REPOSITORY;
const githubToken = args[1];

async function main() {
  for (;;) {
    const url = `https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`;
    const res = await request({
      url,
      headers: {
        authentication: `token ${githubToken}`,
      }
    });
    const totalCount = res.data.total_count;
    for (const job of res.data.jobs) {
      if (job.status === 'completed' && job.conclusion !== 'success') {
        throw new Error(`Job ${job.name} failed.`);
      }
    }
    if (totalCount === requiredJobs.length) {
      console.log('We have a total count match!')
      console.log(requiredJobs);
      console.log(res.data.jobs.map(x => x.name));
      return;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}
main().catch(err => {
  console.log(`::error ${err.message}`);
  console.error(err);
  process.exitCode = -1;
});
