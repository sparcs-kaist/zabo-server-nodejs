# ZABO SERVER API

[SPARCS SSO](https://sparcssso.kaist.ac.kr/)를 사용한 회원 인증이 가능하며 서비스 내에서는 JWT 토큰을 사용합니다.


***

## LIST

### Authentication

 - [<code>GET</code> Check Auth]() /auth
 - [<code>GET</code> Login]() /auth/login
 - [<code>POST</code> Login Callback]()  /auth/login/callback
 - [<code>GET</code> Logout]() /auth/logout
 - [<code>GET</code> Unregister]() /auth/unregister

### Group
 - [<code>GET</code> Get Group Info]() /group/:groupId
 - [<code>POST</code> Update Group Photo]() /group/:groupId
 - [<code>POST</code> Update Group Member]() /group/:groupId/member
 - [<code>DELETE</code> Delete Group Member]() /group/:groupId/member
 
### User
 - [<code>GET</code> Get User Info]() /user
 - [<code>POST</code> Set Current Group]() /user/currentGroup/:groupId

### Zabo
 - [<code>GET</code> Get Zabo Info]() /zabo
 - [<code>GET</code> Get Zabo List]() /zabo/list
 - [<code>GET</code> Get Next Zabo List]() /zabo/list/next
 - [<code>POST</code> Create New Zabo]() /zabo
 - [<code>DELETE</code> Delete Zabo]() /zabo

### Admin
 - [<code>POST</code> Create New Group]() /admin/group
 - [<code>DELETE</code> Delete Group]() /admin/group/:groupId
 - [<code>POST</code> Fake Register]() /admin/fakeRegister
 - [<code>POST</code> Fake Login]() /admin/fakeLogin
 - [<code>GET</code> Get User Info]() /admin/user/:studentId

***

## Authentication

Following **Authorization** field must be set in HTTP request header
```json
{
  'Authorization': `Bearer ${jwt}`
 }
```
## Specification

### User

#### <code>GET</code> /auth () ⇒ <code>user</code>

토큰이 유효한지 검사하고 유효한 경우 유저 정보로 응답합니다.

인증 요구사항 : 유저 엑세스 토큰 (선택)

##### Errors

403 : 유효하지 않은 토큰\
500

##### Example



#### <code>GET</code> /auth/login () => <code>redirect to sparcssso</code>

세션 검증을 위한 state 코드를 생성하고, 유저를 sparcssso 서비스로 리다이렉트 시킵니다.


##### Errors

500

##### Example

#### <code>POST</code> /auth/login/callback (state, code) => <code>{ token, user }</code>

유효성 확인 
 - state 코드가 위조되지 않았는지 확인합니다. 

주어진 code로 sparcssso 유저 정보를 취득합니다.\
서비스 데이터베이스에 해당 유저의 정보가 존재하는지 체크하고 최신 정보로 업데이트합니다.\
유저가 처음 생성된 경우 "저장된 포스터" board를 새로 생성하고 할당합니다.\
새로운 엑세스 토큰을 발급합니다.\
토큰과 유저 정보로 응답합니다.

##### Errors

401 : 세션 hijacked\
500

##### Example
 
#### <code>GET</code> /auth/logout () => <code>redirect to sparcssso</code>

TODO: 토큰을 만료시킵니다.\
sparcssso 로그아웃 주소로 리다이렉트 시킵니다.

##### Errors

500

##### Example

#### <code>POST</code> /auth/unreigister () => <code>?</code>

TODO : 회원 정보를 삭제하고 sparcssso에 등록해지 요청을 보냅니다.

##### Errors

500

##### Example

### Group

#### <code>GET</code> /group/:groupId () => <code>groupInfo</code>

그룹 정보를 가져옵니다.

| Param  | Type                | Description  |
 | ------ | ------------------- | ------------ |
 | groupId  | <code>string</code> | group id |
 
##### Errors

404 : 그룹 정보 없음

##### Example

#### <code>POST</code> /group/:groupId

유효성 확인
 - 그룹의 관리자인지 체크합니다.
 - groupId에 해당하는 그룹이 존재하는지 확인합니다.
 
TODO: 그룹의 정보 (사진)을 업데이트할 수 있습니다. 이름도 변경 가능하게 할까?

| Param  | Type                | Description  |
 | ------ | ------------------- | ------------ |
 | groupId  | <code>string</code> | group id |
 
##### Errors

400 : 유효하지 않은 요청\
403 : 권한 없음\
404\
500

##### Example

#### <code>POST</code> /group/:groupId/member (studentId) => <code>groupInfo</code>

유효성 확인
 - 그룹의 관리자인지 체크합니다.
 - groupId에 해당하는 그룹이 존재하는지 확인합니다.
 - studentId가 유효한지 체크합니다.
 - 자신의 권한은 수정할 수 없습니다.

그룹에 멤버를 추가하거나 멤버의 권한을 변경할 수 있습니다.\
그룹에 맴버가 추가된 경우, 유저 doc에도 그룹 정보를 추가해줍니다.\
업데이트 된 그룹 정보로 응답합니다.
 
 | Param  | Type                | Description  |
 | ------ | ------------------- | ------------ |
 | groupId  | <code>string</code> | group id |
 | studentId  | <code>string</code> | student id |

##### Errors

400 : 유효하지 않은 요청\
403 : 권한 없음\
404\
500

##### Example

#### <code>DELETE</code> /group/:groupId/member (studentId) => <code>groupInfo</code>

유효성 확인
 - 그룹의 관리자인지 체크합니다.
 - groupId에 해당하는 그룹이 존재하는지 확인합니다.
 - studentId가 유효한지 체크합니다.
 - 자신의 권한은 수정할 수 없습니다.
 
그룹에서 맴버 정보를 삭제합니다.\
삭제된 맴버의 doc에서 해당 그룹 정보를 삭제합니다.\
삭제된 맴버의 currentGroup이 해당 그룹일 경우 currentGroup을 초기화시킵니다.\
업데이트 된 그룹 정보로 응답합니다.


| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| groupId  | <code>string</code> | group id |
| studentId  | <code>string</code> | student id |

##### Errors

400 : 유효하지 않은 요청\
403 : 권한 없음\
404\
500

##### Example

### User

#### <code>GET</code> /user () => <code>userInfo</code>

유효성 확인
 - 유효한 토큰인지 확인합니다.

유저 정보 + board, group, currentGroup을 populate 해서 응답합니다.

##### Errors

403 : 권한 없음\
500

##### Example

#### <code>POST</code> /user/currentGroup/:groupId () => <code>userInfo</code>

유효성 확인
 - 유효한 토큰인지 확인합니다.
 - 해당 그룹의 맴버인지 확인합니다.
 
유저의 현재 선택 그룹을 변경합니다.
업데이트 된 유저 정보로 응답합니다. 

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| groupId  | <code>string</code> | group id |

##### Errors

400\
403 : 권한 없음\
404\
500

##### Example

### Zabo

#### <code>GET</code> /zabo (id) => <code>zabo</code>

유효성 확인
- id는 필수입니다.
- id는 mongoDB의 valid한 ObjectID이어야 합니다.
- id가 Database에 존재해야 합니다.

전달받은 id에 해당하는 Zabo를 검색합니다.
해당 Zabo로 응답합니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id  | <code>string</code> | database id |

##### Errors

400 : null id 혹은 invalid id\
404 : 해당하는 zabo가 없음
500

#### <code>GET</code> /zabo/list () => <code>zaboList</code>

최초로 보여지는 zabo들을 가져옵니다.

##### Errors

500

#### <code>GET</code> /zabo/list/next (id) => <code>zaboList</code>

유효성 확인
- id는 필수입니다.
- id가 Database에 존재해야 합니다.

다음으로 보여질 zabo들을 가져옵니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id  | <code>string</code> | last id of previous list |

##### Errors

400 : null id\
404 : 해당하는 zabo가 없음\
500

#### <code>POST</code> /zabo (img, title, description, category, endAt) => success

유효성 확인
- img, title, description, category, endAt은 필수입니다.
- img는 20개 이하로 전송해야 합니다.
- category는 recruit, seminar, contest, event, show, fair중 하나여야 합니다.

새로운 zabo를 저장합니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| img  | <code>multipart-form-data</code> | image of zabo |
| title  | <code>string</code> | title of zabo |
| description  | <code>string</code> | description of zabo |
| category  | <code>string</code> | category of zabo |
| endAt  | <code>date</code> | end time of zabo |

##### Errors

400\
500

#### <code>DELETE</code> /zabo (id) => success

유효성 확인
- id는 필수입니다.

하나의 zabo를 제거합니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| id  | <code>string</code> | id of zabo |

##### Errors

400 : null id\
500

### Admin

#### <code>POST</code> /admin/group (name, ownerStudentId) => <code>groupInfo</code>
 
유효성 확인
 - name과 ownerStudentId는 필수
 - 같은 이름을 가진 그룹이 존재할 수 없음 (schema constraint)
 - ownerStudentId에 해당하는 유저가 존재해야함
 
그룹을 생성하고 첫 관리자를 추가합니다.\
관리자의 doc에 그룹을 추가합니다.\
생성된 그룹 정보로 응답합니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| name  | <code>string</code> | group name |
| ownerStudentId  | <code>string</code> | student id |

#### <code>DELETE</code> /admin/group/:groupId () => success

TODO
'삭제' 상태의 그룹에는 맴버 추가, 그룹 선택 기능이 불가능하도록 한다.\
그룹을 상태를 '삭제' 상태로 업데이트한다. \
그룹의 맴버가 해당 그룹을 currentGroup으로 가지고 있으면 초기화한다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| groupId  | <code>string</code> | group id |

#### <code>POST</code> /admin/fakeRegister (studentId) => <code>userInfo</code>

유효성 확인
 - studentId는 필수입니다.

새로운 유저를 생성합니다.\
생성된 유저의 정보로 응답합니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| studentId  | <code>string</code> | student id |

#### <code>POST</code> /admin/fakeLogin (studentId) => <code>jwt</code>

액세스 토큰을 발급해줍니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| studentId  | <code>string</code> | student id |

#### <code>GET</code> /admin/user/:studentId () => <code>userInfo</code>

유저 정보로 응답합니다.

| Param  | Type                | Description  |
| ------ | ------------------- | ------------ |
| studentId  | <code>string</code> | student id |

***

## English

#### <code>GET</code> /auth () ⇒ <code>user</code>

Check if the token is valid access token and repond with user info

**Auth Requirement**: user access token \<optional\>


#### <code>GET</code> /auth/login () => <code>redirect to sparcssso</code>

Generate state for session verification and redirect user to sparcssso

#### <code>POST</code> /auth/login/callback (state, code) => <code>{ token, user }</code>

Check if state is not intercepted\
Get sso user info from given code\
Check if user info exist in our user database, update with new user info from sso.\
If it's first time for user to visit our service, create a new board called "저장된 포스터"\
Generate new token\
Respond with token and user info
