module namespace cms = "http://cms.algorythm.de/functions";
declare default element namespace "http://cms.algorythm.de/common/CMS";
declare namespace s = "http://cms.algorythm.de/common/Site";

import module namespace functx = "http://www.functx.com";

declare variable $cms:DATABASE as xs:string := 'testdb';

(: Resolves given path to node relative to parent. E.g.: *, child/el, el/@attr, el[1] :)
declare function cms:dynamic-path($parent as node(), $path as xs:string) as item()* {
	let $nextStep := functx:substring-before-if-contains($path,'/')
	let $restOfSteps := substring-after($path,'/')
	return if (contains($nextStep,'['))
		then (
			let $nodeName := substring-before($nextStep,'[')
			let $pos := number(substring-before(substring-after($nextStep,'['),']'))
			let $child := $parent/*[functx:name-test(name(),$nodeName)][$pos]
			return if ($child and $restOfSteps)
				then cms:dynamic-path($child, $restOfSteps)
				else $child
		)
		else for $child in ($parent/*[functx:name-test(name(),$nextStep)],
				$parent/@*[functx:name-test(name(), substring-after($nextStep,'@'))])
			return if ($restOfSteps)
				then cms:dynamic-path($child, $restOfSteps)
				else $child
};