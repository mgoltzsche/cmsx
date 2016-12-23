module namespace p = "http://cmsx.algorythm.de/service/page";
declare namespace s = "http://cms.algorythm.de/common/Site";

declare
%rest:GET
%rest:path("/service/page")
%output:method("json")
function p:get-page() {
  p:get-page('')
};

declare
%rest:GET
%rest:path("/service/page/{$pageID=.*}")
%output:method("json")
function p:get-page($pageID as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := if ($pageID)
    then $site//s:page[@id=$pageID]
    else $site
  return if ($page)
    then (
      let $pageChildren := map {
        'parents': array {for $parent in $page/ancestor::* return p:map($parent)},
        'children': array {for $child in $page/s:page return p:map($child)}
      }
      return map:merge((p:map($page), $pageChildren))
    )
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pageID)
};

declare
%rest:PUT("{$pageAttrs}")
%rest:path("/service/page/{$pagePath=.+}")
%rest:consumes("application/json")
updating function p:create-page($pagePath as xs:string, $pageAttrs as node()) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $pathSegments := fn:tokenize($pagePath, '/')
  let $newPageID := $pathSegments[last()]
  let $parentPageID := $pathSegments[last() - 1]
  let $parentPage := if ($parentPageID)
    then $site//s:page[@id=$parentPageID]
    else $site
  return if ($newPageID='' or $site//s:page[@id=$newPageID])
    then fn:error(xs:QName('CMSXINVALIDID'), 'Empty or duplicate page ID: '||$newPageID)
    else if ($parentPage)
      then insert node <s:page>
          {for $attr in $pageAttrs/*/child::* return attribute {$attr/name()} {$attr/text()}}
        </s:page> into $parentPage
      else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$parentPageID)
};

declare
%rest:POST("{$pageAttrs}")
%rest:path("/service/page/{$pageID=.+}")
%rest:consumes("application/json")
updating function p:update-page($pageID as xs:string, $pageAttrs as node()) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := if ($pageID)
    then $site//s:page[@id=$pageID]
    else $site
  return if ($page)
    then (
      delete nodes $page/@*,
      for $attr in $pageAttrs/*/child::*
        return insert node attribute {$attr/name()} {$attr/text()} into $page
    )
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pageID) 
};

declare
%rest:DELETE
%rest:path("/service/page/{$pageID=.+}")
updating function p:delete-page($pageID as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := $site//s:page[@id=$pageID]
  return if ($page)
    then delete nodes $page
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pageID) 
};

declare
%rest:method("MOVE")
%rest:path("/service/page/{$pageID=.+}")
%rest:header-param("Move-Context", "{$ctxPageID}")
%rest:header-param("Move-Mode", "{$mode}", "append")
updating function p:move-page($pageID as xs:string, $ctxPageID as xs:string, $mode as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := $site//s:page[@id=$pageID]
  let $ctxPage := if ($ctxPageID)
    then $site//s:page[@id=$ctxPageID]
    else $site
  return if ($page)
    then if ($ctxPage)
      then if ($mode = 'append')
        then (
            delete node $page,
            insert node $page as last into $ctxPage
        ) else if ($mode = 'before')
          then (
            delete node $page,
          	insert node $page before $ctxPage
          ) else fn:error(xs:QName('CMSXINVALIDARG'), 'Invalid page move mode: '||$mode||'. Allowed: append|before')
      else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$ctxPageID)
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pageID) 
};

declare function p:map($page as node()) as map(*) {
  map:merge((for $attr in $page/@* return map {$attr/name(): $attr/string()}))
};

declare function p:href($page as node()) as xs:string {
  fn:string-join(for $parent in $page/ancestor-or-self::s:page return '/' || $parent/@id/string(), '')
};