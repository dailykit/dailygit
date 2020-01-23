### DailyGit

> A headless CMS powered by GraphQL built with Filesystem and Git to provide content versioning. Build your own CMS by defining contextual entity schemas.✨

**Stack📚:**
- [NodeJs](https://github.com/nodejs/node)
- [MongoDB(Mongoose)](https://github.com/Automattic/mongoose)
- [Apollo GraphQL](https://github.com/apollographql/apollo-server)
- [Isomorphic Git](https://github.com/isomorphic-git/isomorphic-git)

![DailyGit](https://d33wubrfki0l68.cloudfront.net/bea8fc18eb4c61b9a935be72cc6fa1dd0c330c29/49cb6/static/dailygit-flow-b7f300b9a57275b21483c323095e63cc.png "DailyGit")

DailyGit is built with three components viz. filesystem, git and database. These three in composition provides an ecosystem to curate files that could potentially represent anything like articles, product's information, recipes etc with versioning out of the box and additional database for faster search and dependency management.

### File System
DailyGit uses filesystem to handles file based operations that are built using NodeJs's `fs` module.

**Methods:**

1. createFile
   
|params  | type | description |
|:--|:--|:--|
| path | String | The path of the file to be stored in. |
| content | String | The content to be stored in the file. |

2. deleteFile

|params  | type | description |
|:--|:--|:--|
| path | String | The path where the file is stored in. |

3. getFile

|params  | type | description |
|:--|:--|:--|
| path | String | The path where the file is stored in. |

4. updateFile

|params  | type | description |
|:--|:--|:--|
| path | String | The path where the file is stored in. |
| data | String | The content to replace the existing content with. |
| message | String | Message to label the commit with. |

5. draftFile

|params  | type | description |
|:--|:--|:--|
| path | String | The path where the file is stored in. |
| content | String | The content to replace the existing content with. |

6. renameFile

|params  | type | description |
|:--|:--|:--|
| oldPath | String | The path where the file is stored in. |
| newPath | String | The path where you want to move the file to. |

> Read the full documentation - [Link](https://docs.dailykit.org/ "Documentation")
