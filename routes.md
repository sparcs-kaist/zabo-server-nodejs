# API

[SPARCS SSO](https://sparcssso.kaist.ac.kr/)를 사용한 회원 인증이 가능하며 서비스 내에서는 JWT 토큰을 사용합니다.

## LIST

### Authentication

* [`GET`](routes.md) /auth
* [`GET`](routes.md) /auth/login
* [`GET`](routes.md) /auth/loginApi
* [`POST`](routes.md)  /auth/login/callback
* [`GET`](routes.md) /auth/logout
* [`GET`](routes.md) /auth/unregister

### Group

* [`GET`](routes.md) /group/recommends
* ['POST`](routes.md) /group/apply
* [`GET`](routes.md) /group/:groupName
* [`POST`](routes.md) /group/:groupName
* [`POST`](routes.md) /group/:groupName/background
* [`PUT`](routes.md) /group/:groupName/member
* [`POST`](routes.md) /group/:groupName/member
* [`DELETE`](routes.md) /group/:groupName/member
* [`GET`](routes.md) /group/:groupName/zabo/list

### User

* [`GET`](routes.md) /user
* [`POST`](routes.md) /user
* [`GET`](routes.md) /user/:username/pins
* [`POST`](routes.md) /user/background
* [`POST`](routes.md) /user/currentGroup/:groupName

### Zabo

* [`POST`](routes.md) /zabo
* [`GET`](routes.md) /zabo/:zaboId
* [`GET`](routes.md) /zabo/list
* [`GET`](routes.md) /zabo/hot
* [`GET`](routes.md) /zabo/deadline
* [`PATCH`](routes.md) /zabo/:zaboId
* [`POST`](routes.md) /zabo/:zaboId/pin
* [`POST`](routes.md) /zabo/:zaboId/like
* [`DELETE`](routes.md) /zabo/:zaboId/

## Authentication

Following **Authorization** field must be set in HTTP request header

```javascript
{
  'Authorization': `Bearer ${jwt}`
 }
```

## Specification

### User

#### `GET` /auth \(\) ⇒ `user`

토큰이 유효한지 검사하고 유효한 경우 유저 정보로 응답합니다.

인증 요구사항 : 유저 엑세스 토큰 \(선택\)

**Require**

없음

**Response**

없음

**Errors**

403 : 유효하지 않은 토큰 500

**Example**

#### `GET` /auth/login \(\) =&gt; `redirect to sparcssso`

세션 검증을 위한 state 코드를 생성하고, 유저를 sparcssso 서비스로 리다이렉트 시킵니다.

**Require**
 
url : String
state : String
 
**Response**
 
없음

**Errors**

500

**Example**

#### `POST` /auth/login/callback \(state, code\) =&gt; `{ token, user }`

유효성 확인

* state 코드가 위조되지 않았는지 확인합니다. 

주어진 code로 sparcssso 유저 정보를 취득합니다. 서비스 데이터베이스에 해당 유저의 정보가 존재하는지 체크하고 최신 정보로 업데이트합니다. 유저가 처음 생성된 경우 "저장된 포스터" board를 새로 생성하고 할당합니다. 새로운 엑세스 토큰을 발급합니다. 토큰과 유저 정보로 응답합니다.

**Require**
 
url : String
state : String
 
**Response**
 
url: String

**Errors**

401 : 세션 hijacked 500

**Example**

#### `GET` /auth/logout \(\) =&gt; `redirect to sparcssso`

TODO: 토큰을 만료시킵니다. sparcssso 로그아웃 주소로 리다이렉트 시킵니다.

**Request**

없음

URL Parameter: 없음
Body: 없음

**Response**

없음

사용자를 sparcs sso url로 리다이렉트 시킵니다.
이동시킬 주소를 Response 객체의 location에 담고, http 301 응답 코드를 반환합니다.

**Errors**

500

**Example**

#### `POST` /auth/unreigister \(\) =&gt; `?`

TODO : 회원 정보를 삭제하고 sparcssso에 등록해지 요청을 보냅니다.

**Require**

없음

**Response**

없음

**Errors**

500

**Example**

### Group

#### `GET` /group/:groupId \(\) =&gt; `groupInfo`

그룹 정보를 가져옵니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

**Errors**

404 : 그룹 정보 없음

**Example**

#### `POST` /group/:groupId

유효성 확인

* 그룹의 관리자인지 체크합니다.
* groupId에 해당하는 그룹이 존재하는지 확인합니다.

TODO: 그룹의 정보 \(사진\)을 업데이트할 수 있습니다. 이름도 변경 가능하게 할까?

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

**Errors**

400 : 유효하지 않은 요청 403 : 권한 없음 404 500

**Example**

#### `POST` /group/:groupId/member \(studentId\) =&gt; `groupInfo`

유효성 확인

* 그룹의 관리자인지 체크합니다.
* groupId에 해당하는 그룹이 존재하는지 확인합니다.
* studentId가 유효한지 체크합니다.
* 자신의 권한은 수정할 수 없습니다.

그룹에 멤버를 추가하거나 멤버의 권한을 변경할 수 있습니다. 그룹에 맴버가 추가된 경우, 유저 doc에도 그룹 정보를 추가해줍니다. 업데이트 된 그룹 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |
| studentId | `string` | student id |

**Errors**

400 : 유효하지 않은 요청 403 : 권한 없음 404 500

**Example**

#### `DELETE` /group/:groupId/member \(studentId\) =&gt; `groupInfo`

유효성 확인

* 그룹의 관리자인지 체크합니다.
* groupId에 해당하는 그룹이 존재하는지 확인합니다.
* studentId가 유효한지 체크합니다.
* 자신의 권한은 수정할 수 없습니다.

그룹에서 맴버 정보를 삭제합니다. 삭제된 맴버의 doc에서 해당 그룹 정보를 삭제합니다. 삭제된 맴버의 currentGroup이 해당 그룹일 경우 currentGroup을 초기화시킵니다. 업데이트 된 그룹 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |
| studentId | `string` | student id |

**Errors**

400 : 유효하지 않은 요청 403 : 권한 없음 404 500

**Example**

### User

#### `GET` /user \(\) =&gt; `userInfo`

유효성 확인

* 유효한 토큰인지 확인합니다.

유저 정보 + board, group, currentGroup을 populate 해서 응답합니다.

**Errors**

403 : 권한 없음 500

**Example**

#### `POST` /user/currentGroup/:groupId \(\) =&gt; `userInfo`

유효성 확인

* 유효한 토큰인지 확인합니다.
* 해당 그룹의 맴버인지 확인합니다.

유저의 현재 선택 그룹을 변경합니다. 업데이트 된 유저 정보로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| groupId | `string` | group id |

**Errors**

400 403 : 권한 없음 404 500

**Example**

### Zabo

#### `GET` /zabo \(id\) =&gt; `zabo`

유효성 확인

* id는 필수입니다.
* id는 mongoDB의 valid한 ObjectID이어야 합니다.
* id가 Database에 존재해야 합니다.

전달받은 id에 해당하는 Zabo를 검색합니다. 해당 Zabo로 응답합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| id | `string` | database id |

**Errors**

400 : null id 혹은 invalid id 404 : 해당하는 zabo가 없음 500

#### `GET` /zabo/list \(\) =&gt; `zaboList`

최초로 보여지는 zabo들을 가져옵니다.

**Errors**

500

#### `GET` /zabo/list/next \(id\) =&gt; `zaboList`

유효성 확인

* id는 필수입니다.
* id가 Database에 존재해야 합니다.

다음으로 보여질 zabo들을 가져옵니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| id | `string` | last id of previous list |

**Errors**

400 : null id 404 : 해당하는 zabo가 없음 500

#### `POST` /zabo \(img, title, description, category, schedules\) =&gt; success

유효성 확인

* img, title, description, category는 필수입니다.
* img는 20개 이하로 전송해야 합니다.
* category는 recruit, seminar, contest, event, show, fair중 하나여야 합니다.

새로운 zabo를 저장합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| img | `multipart-form-data` | image of zabo |
| title | `string` | title of zabo |
| description | `string` | description of zabo |
| category | `string` | category of zabo |
| schedules  | <code>[{title, startAt, endAt, type}]</code> | time info of zabo |

**Errors**

400 500

#### `DELETE` /zabo \(id\) =&gt; success

유효성 확인

* id는 필수입니다.

하나의 zabo를 제거합니다.

| Param | Type | Description |
| :--- | :--- | :--- |
| id | `string` | id of zabo |

**Errors**

400 : null id 500

## English

#### `GET` /auth \(\) ⇒ `user`

Check if the token is valid access token and repond with user info

**Auth Requirement**: user access token \

#### `GET` /auth/login \(\) =&gt; `redirect to sparcssso`

Generate state for session verification and redirect user to sparcssso

#### `POST` /auth/login/callback \(state, code\) =&gt; `{ token, user }`

Check if state is not intercepted Get sso user info from given code Check if user info exist in our user database, update with new user info from sso. If it's first time for user to visit our service, create a new board called "저장된 포스터" Generate new token Respond with token and user info

