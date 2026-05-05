/**
 * GLSL inlined for Next.js Turbopack (avoid custom raw loader).
 */
/* eslint-disable import/no-anonymous-default-export -- shader string blob */

export default 'varying vec2 vScreenUv;\nvarying vec2 vContainUv;\nvarying float vContainMask;\n\nuniform float uPlaneAspect;\nuniform float uImageAspect;\n\nvoid main() {\n\tvec2 uvPlane = uv;\n\tvec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\tvec3 ndc = clip.xyz / clip.w;\n\tvScreenUv = ndc.xy * 0.5 + 0.5;\n\n\tvec2 ct;\n\tfloat mask = 1.0;\n\n\tif (uImageAspect > uPlaneAspect + 1e-6) {\n\t\tfloat scale = uPlaneAspect / uImageAspect;\n\t\tct.x = (uvPlane.x - 0.5) / scale + 0.5;\n\t\tct.y = uvPlane.y;\n\t\tmask = step(0.0, ct.x) * step(ct.x, 1.0);\n\t} else if (uImageAspect < uPlaneAspect - 1e-6) {\n\t\tfloat scale = uImageAspect / uPlaneAspect;\n\t\tct.x = uvPlane.x;\n\t\tct.y = (uvPlane.y - 0.5) / scale + 0.5;\n\t\tmask = step(0.0, ct.y) * step(ct.y, 1.0);\n\t} else {\n\t\tct = uvPlane;\n\t}\n\n\tvContainUv = ct;\n\tvContainMask = mask;\n\tgl_Position = clip;\n}\n'
