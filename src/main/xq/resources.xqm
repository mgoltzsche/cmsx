module namespace resources = "http://cms.algorythm.de/web/resources";
declare default element namespace "http://cms.algorythm.de/common/CMS";

declare
%rest:GET
%rest:path("resources/{$path=.+}")
function resources:get($path as xs:string) {
	let $absPath := '/home/max/development/java/basex/basex-api/src/main/webapp/repo/http-cmsx.algorythm.de-cmsx-0.0.1/cmsx/resources/'||$path
	let $mimeType := web:content-type($absPath)
	return try {
		(
			<rest:response>
				<output:serialization-parameters>
					<output:media-type value='{$mimeType}'/>
				</output:serialization-parameters>
			</rest:response>,
			(: response:stream-binary(file:read-binary($absPath), 'media-type='||$mimeType, 'file') :)
			file:read-binary($absPath)
		)
	} catch file:not-found {
		<rest:response>
    		<http:response status="404" message="Resource not found">
      			<http:header name="Content-Type" value="text/plain; charset=UTF-8" />
      			<http:header name="Content-Language" value="en" />
    		</http:response>
  		</rest:response>
	}
};