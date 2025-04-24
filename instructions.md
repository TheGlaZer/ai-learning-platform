client rules:
write css in styled compoents like this - 
import styled from '@emotion/styled';
export const DashboardContainer = styled(Box)`
  border: none;
  height: 100%;
  transition: all 0.3s ease;
`;
generate high quality senior level code
seperate big components into sub compoents component should not be more than 20-30 rows
build custom hook under hooks folder for state and logic, keep compoents clean, use custom hook exists if it matches your needs
keep related componets and sub components in same folder
every static texts you add plz use he.json en.json messages files and useTranslation hook 
to write texts
reuse compoent and hooks that already exists
follow theme colors in colors.ts file when generating the ui 
dont write inline stylings.. write styled components with meaningfull names use styled from emotion f
add client side validations for forms 
every api call need to be implment in the matching client service!!!
IMPORTANT !!!! when implment custom hook never access supabase or any backend logic.. you will always implmet a route or use existsing one and there abstrct BL logic to matching service.. dont write backend code in client side at all !!!!! 
when supporting RTL plz dont change flex-drection css prop!!



backend rules:
write in typescript and clean senioer level code 
VERY IMPORTANT: use functions and utils for existing functioality !!! 
VERY VEY VERY IMPORTANT: plz always pick the most simple solution to the problem !!! 
seprate long logics into functions and import them if some service or funciton has too much code inside it 
IMPORTANT! please before coding logic related to system entities check the current models and fileds and relations in the models folder!!!
add servier side validations for buisness logic 
insure in backend api route you send auth token if needed useing verifyAuth function from authService.ts
when need to create an action or check error about an main entity in the system check the matching api route and services 
if exists.. do you changes or addons there..
IMPORTANT !!! always choose the most simple soultion for every decistion you make plz!!!

ai features:
see the ai folder unedr lib-server. and follow this modular interfaces and services and intergrate the feature in there for the backend side

IMPORTANT: 
when examing the soultion plz always choose the most simple solution for the problem..!!!! we dont want to over engenring problems and features!!!!