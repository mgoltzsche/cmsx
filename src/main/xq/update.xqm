module namespace upd = "http://cmsx.algorythm.de/service/update";
declare namespace s = "http://cms.algorythm.de/common/Site";
declare namespace h = "http://www.w3.org/1999/xhtml";

import module namespace db = "http://basex.org/modules/db";
import module namespace html = "http://basex.org/modules/html";

(:
 : Set option UPDINDEX=true to enable incremental indexing (Not working for full-text indices)
 : Set AUTOOPTIMIZE or run db:optimize to make sure index is up to date (takes long time)
 :)

declare
%rest:path('/doc/{$contentPath=.+}')
%rest:query-param('xpath', '{$xpath}')
%rest:POST("{$value}")
%output:method('text')
(: %rest:form-param('xpath', '{$xpath}')
   %rest:form-param('value', '{$value}') :)
updating function upd:update-document($contentPath as xs:string, $xpath as xs:string, $value as item()) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $docPath := $db||'/'||$contentPath
  return try {
    let $doc := doc($docPath)
    let $alterNode := upd:dynamic-path($doc, $xpath)
    return if ($alterNode)
      then if ($value instance of xs:string)
        (: TODO: insert new attribute if not found :)
        then replace value of node $alterNode with $value
        else replace node $alterNode with $value/*
      else
        fn:error(xs:QName('CMSXPATHNOTFOUND'), 'Path not found: '||$xpath)
  } catch bxerr:BXDB0006 {
    fn:error(xs:QName('CMSXDOCNOTFOUND'), 'Content not found: '||$contentPath, 404)
  }
};

(:~
 : Resolves the given xpath against the node provided.
 : E.g.: *, child/el, el/@attr, el[1]
 : Enhanced functx' dynamic-path version taking element indexes into account.
 :
 : @author  Max Goltzsche <max.goltzsche@algorythm.de>
 : @version 1.0
 : @param   $parent node to resolve path relative to
 : @param   $path path to resolve
 :)
declare function upd:dynamic-path($parent as node(), $path as xs:string) as node()* {
  let $nextStep := if (contains($path,'/'))
    then substring-before($path,'/')
    else $path
  let $restOfSteps := substring-after($path,'/')
  return if (contains($nextStep,'['))
    then
      let $nodeName := substring-before($nextStep,'[')
      let $pos := number(substring-before(substring-after($nextStep,'['),']'))
      let $child := $parent/*[upd:name-test(name(),$nodeName)][$pos]
      return if ($child and $restOfSteps)
        then upd:dynamic-path($child, $restOfSteps)
        else $child
    else for $child in ($parent/*[upd:name-test(name(),$nextStep)],
      $parent/@*[upd:name-test(name(),substring-after($nextStep,'@'))])
        return if ($restOfSteps)
          then upd:dynamic-path($child, $restOfSteps)
          else $child
};

(:~
 : Whether the provided node's name matches the wildcard name provided.
 : (Simplified version of functx' name-test function)
 :
 : @author  Max Goltzsche 
 : @version 1.0  
 : @param   $nodeName the node's name 
 : @param   $name the name to match
 :)
declare function upd:name-test($nodeName as xs:string?, $name as xs:string) as xs:boolean {
  $name = $nodeName
  or
  $name = '*'
  or
  substring-after($name,'*:') = (if (contains($nodeName,':'))
    then substring-after($nodeName,':')
    else $nodeName)
  or
  substring-before($nodeName,':') = (if (contains($name, ':*'))
    then substring-before($name,':*')
    else ())
};

declare
%rest:path("p/{$pagePath=.+}/index.html")
%rest:query-param('prop', '{$prop}')
%rest:query-param('val', '{$value}')
%rest:POST
%output:method('text')
updating function upd:update-page-value($pagePath as xs:string, $prop as xs:string, $value as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $pageID := tokenize($pagePath)[last()]
  let $page := doc($db||'/cms-site.xml')/s:site//s:page[@id=$pageID]
  return if ($page)
    then if ($page[@title])
      then replace value of node $page/@title with $value
      else insert node attribute { 'title' } { $value } into $page
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pagePath)
};